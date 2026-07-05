import type { ExtractedStepRaw, ExtractTourRequest, ExtractTourResult } from "./types";
import {
  detectBranchesInText,
  detectPrerequisitesInText,
  estimateMinutes,
  extractKeywords,
  findHighlightPhrase,
} from "@/lib/ingest/source-text";

interface RawChunk {
  title: string;
  body: string;
  score: number;
  chapter: string;
}

/** Rule-based extraction when no LLM API key is configured */
export function extractTourHeuristic(req: ExtractTourRequest): ExtractTourResult {
  const keywords = extractKeywords(req.goal);
  const chunks = buildChunks(req.sourceText, keywords);
  const hasBranches = detectBranchesInText(req.sourceText);
  const steps: ExtractedStepRaw[] = [];

  const prereqChunks = chunks.filter((c) => c.chapter === "Prerequisites");
  const coreChunks = chunks.filter((c) => c.chapter === "Core Setup");
  const verifyChunks = chunks.filter((c) => c.chapter === "Verification");

  for (const chunk of prereqChunks.slice(0, 2)) {
    steps.push(chunkToStep(chunk, req));
  }

  let coreToUse = coreChunks.length > 0 ? coreChunks : chunks.slice(0, 5);

  if (hasBranches && coreToUse.length > 1) {
    const beforeBranch = coreToUse.slice(0, Math.ceil(coreToUse.length / 2));
    const afterBranch = coreToUse.slice(Math.ceil(coreToUse.length / 2));

    for (const chunk of beforeBranch) {
      steps.push(chunkToStep(chunk, req));
    }

    steps.push({
      type: "branch",
      chapter: "Core Setup",
      headline: "Which operating system are you using?",
      body: "Wayfinder will tailor the next steps to your environment.",
      previewTitle: "OS BRANCH",
      branchOptions: [
        {
          id: "macos",
          label: "macOS",
          description: "Uses Terminal and macOS-specific steps from the source.",
        },
        {
          id: "windows",
          label: "Windows",
          description: "Uses PowerShell and Windows-specific steps from the source.",
        },
      ],
    });

    const macChunk = findBranchChunk(req.sourceText, "mac");
    const winChunk = findBranchChunk(req.sourceText, "windows");

    if (macChunk) {
      steps.push({
        ...chunkToStep(macChunk, req),
        branchId: "macos",
      });
    }
    if (winChunk) {
      steps.push({
        ...chunkToStep(winChunk, req),
        branchId: "windows",
      });
    }

    for (const chunk of afterBranch) {
      steps.push(chunkToStep(chunk, req));
    }
  } else {
    for (const chunk of coreToUse.slice(0, 6)) {
      steps.push(chunkToStep(chunk, req));
    }
  }

  const verifyChunk = verifyChunks[0] ?? chunks.find((c) => /verif|confirm|check/i.test(c.title + c.body));
  if (verifyChunk) {
    steps.push({
      type: "checkpoint",
      chapter: "Verification",
      headline: verifyChunk.title,
      body: verifyChunk.body,
      previewTitle: "VERIFY",
      checkpointPrompt: `Confirm: ${verifyChunk.title.replace(/\.$/, "")} — did this work?`,
      sourcePassageText: verifyChunk.body,
      sourceHighlight: findHighlightPhrase(verifyChunk.body, keywords),
      stuckMismatch: "Re-read the verification section in the source doc and check for environment-specific notes.",
    });
  }

  if (steps.length < 3) {
    return fallbackMinimalTour(req);
  }

  const branchCount = steps.filter((s) => s.type === "branch").length > 0 ? 2 : 0;
  const mainCount = steps.filter((s) => !s.branchId).length;

  return {
    title: tourTitleFromGoal(req.goal),
    steps,
    estimatedMinutes: estimateMinutes(mainCount),
    branchCount,
    method: "heuristic",
  };
}

function buildChunks(text: string, keywords: string[]): RawChunk[] {
  const numbered = extractNumberedItems(text);
  if (numbered.length >= 3) {
    return numbered.map((item, i) => ({
      title: item.title,
      body: item.body,
      score: scoreText(item.title + " " + item.body, keywords),
      chapter: inferChapter(item.title + " " + item.body, i, numbered.length),
    })).sort((a, b) => b.score - a.score);
  }

  const sections = splitSections(text);
  return sections
    .map((s, i) => ({
      ...s,
      score: scoreText(s.title + " " + s.body, keywords),
      chapter: inferChapter(s.title + " " + s.body, i, sections.length),
    }))
    .filter((s) => s.body.length > 30)
    .sort((a, b) => b.score - a.score);
}

function extractNumberedItems(text: string): Array<{ title: string; body: string }> {
  const pattern = /(?:^|\n)\s*(\d+[\.)]\s+)([^\n]+)/g;
  const matches = [...text.matchAll(pattern)];
  if (matches.length < 3) return [];

  const items: Array<{ title: string; body: string }> = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index! + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    const body = text.slice(start, end).trim();
    items.push({
      title: matches[i][2].trim(),
      body: body.split("\n")[0]?.trim() || matches[i][2].trim(),
    });
  }
  return items;
}

function splitSections(text: string): Array<{ title: string; body: string }> {
  const parts = text.split(/\n(?=#{1,3}\s+|\*{0,2}[A-Z][A-Za-z\s]{3,30}\*{0,2}\n|[A-Z][A-Z\s]{4,}\n)/);
  if (parts.length > 1) {
    return parts.map((p) => {
      const lines = p.trim().split("\n");
      const title = lines[0]?.replace(/^#+\s*|\*+/g, "").trim() || "Step";
      const body = lines.slice(1).join(" ").trim() || lines[0] || "";
      return { title, body };
    });
  }

  return text
    .split(/\n{2,}/)
    .filter((p) => p.trim().length > 40)
    .map((p, i) => {
      const sentences = p.trim().split(/(?<=[.!?])\s+/);
      return {
        title: sentences[0]?.slice(0, 80) || `Step ${i + 1}`,
        body: p.trim().slice(0, 400),
      };
    });
}

function scoreText(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) score += 3;
  }
  if (lower.length > 50) score += 1;
  return score;
}

function inferChapter(text: string, index: number, total: number): string {
  const lower = text.toLowerCase();
  if (/prerequisite|before you|required access|you must|ensure/i.test(lower) || index === 0) {
    return "Prerequisites";
  }
  if (/verif|confirm|check|test|validate/i.test(lower) || index >= total - 1) {
    return "Verification";
  }
  return "Core Setup";
}

function findBranchChunk(text: string, platform: "mac" | "windows"): RawChunk | null {
  const paragraphs = text.split(/\n{2,}/);
  for (const p of paragraphs) {
    const lower = p.toLowerCase();
    if (platform === "mac" && /mac\s*os|macos|terminal|darwin/i.test(lower)) {
      const lines = p.trim().split("\n");
      return { title: lines[0].slice(0, 80), body: p.trim().slice(0, 400), score: 1, chapter: "Core Setup" };
    }
    if (platform === "windows" && /windows|powershell/i.test(lower)) {
      const lines = p.trim().split("\n");
      return { title: lines[0].slice(0, 80), body: p.trim().slice(0, 400), score: 1, chapter: "Core Setup" };
    }
  }
  return null;
}

function chunkToStep(chunk: RawChunk, req: ExtractTourRequest): ExtractedStepRaw {
  const keywords = extractKeywords(req.goal);
  const highlight = findHighlightPhrase(chunk.body, keywords);
  return {
    type: "instruction",
    chapter: chunk.chapter,
    headline: chunk.title.endsWith(".") ? chunk.title : chunk.title + ".",
    body: chunk.body.slice(0, 350),
    previewTitle: chunk.title.slice(0, 28).toUpperCase(),
    sourcePassageText: chunk.body.slice(0, 500),
    sourceHighlight: highlight,
    stuckMismatch: "Your screen may differ from the doc — check for version notes or alternate paths in the source.",
    stuckConfused: "Open ⌁ SOURCE PASSAGE on this step to read the original wording.",
  };
}

function tourTitleFromGoal(goal: string): string {
  const t = goal.trim();
  if (t.length <= 50) return t.charAt(0).toUpperCase() + t.slice(1);
  return t.slice(0, 47) + "…";
}

function fallbackMinimalTour(req: ExtractTourRequest): ExtractTourResult {
  const keywords = extractKeywords(req.goal);
  const passage = req.sourceText.slice(0, 500);
  const steps: ExtractedStepRaw[] = [
    {
      type: "instruction",
      chapter: "Getting Started",
      headline: "Review the relevant section of the source.",
      body: `Skim the document for content related to: "${req.goal}".`,
      previewTitle: "REVIEW",
      sourcePassageText: passage,
    },
    {
      type: "instruction",
      chapter: "Core Setup",
      headline: "Follow the documented procedure.",
      body: "Work through the source instructions one action at a time.",
      previewTitle: "EXECUTE",
      sourcePassageText: req.sourceText.slice(200, 700),
      sourceHighlight: keywords[0],
    },
    {
      type: "checkpoint",
      chapter: "Verification",
      headline: "Confirm the outcome.",
      body: "Verify the result matches what the source describes.",
      previewTitle: "VERIFY",
      checkpointPrompt: "Did the setup work as described in the source?",
      sourcePassageText: passage,
    },
  ];

  return {
    title: tourTitleFromGoal(req.goal),
    steps,
    estimatedMinutes: 8,
    branchCount: 0,
    method: "heuristic",
  };
}
