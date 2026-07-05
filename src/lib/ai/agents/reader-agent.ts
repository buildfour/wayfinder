import type { ExtractTourRequest } from "../types";
import type { AgentTraceEntry, ReaderBrief } from "./types";
import { geminiJson, truncateSource } from "./gemini";
import { READER_AGENT_PROMPT, buildReaderUserPrompt } from "./prompts";
import {
  detectBranchesInText,
  detectPrerequisitesInText,
  extractKeywords,
} from "@/lib/ingest/source-text";

export async function runReaderAgent(req: ExtractTourRequest): Promise<{
  brief: ReaderBrief;
  trace: AgentTraceEntry;
}> {
  try {
    const brief = await geminiJson<ReaderBrief>(
      READER_AGENT_PROMPT,
      buildReaderUserPrompt(req.goal, req.sourceTitle, truncateSource(req.sourceText))
    );
    return {
      brief,
      trace: {
        agent: "reader",
        label: "Reader",
        summary: brief.goalSummary || `Focused on: ${req.goal}`,
      },
    };
  } catch {
    return { brief: readerHeuristic(req), trace: readerHeuristicTrace(req) };
  }
}

function readerHeuristic(req: ExtractTourRequest): ReaderBrief {
  const keywords = extractKeywords(req.goal);
  const hasPrereq = detectPrerequisitesInText(req.sourceText);
  const hasBranch = detectBranchesInText(req.sourceText);

  return {
    goalSummary: `Help the user: ${req.goal}`,
    relevantThemes: keywords.slice(0, 5),
    prerequisites: hasPrereq
      ? ["Account access", "Required tools installed", "Credentials ready"]
      : [],
    branchHints: hasBranch ? ["Operating system may change the steps"] : [],
    jargonToSimplify: keywords.filter((k) => k.length > 6).slice(0, 4),
  };
}

function readerHeuristicTrace(req: ExtractTourRequest): AgentTraceEntry {
  return {
    agent: "reader",
    label: "Reader",
    summary: `Scanned source for "${req.goal.slice(0, 60)}"`,
  };
}
