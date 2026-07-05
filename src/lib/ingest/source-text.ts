/**
 * Rule-based excerpt extraction from source text for passages and stuck help.
 * Phase 4 will replace this with LLM extraction.
 */

export function extractKeywords(goal: string): string[] {
  const stop = new Set([
    "i", "just", "need", "to", "get", "the", "a", "an", "for", "my", "and", "or",
    "working", "setup", "set", "up", "with", "from", "this", "that", "how", "do",
  ]);
  return goal
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w));
}

export function findRelevantParagraph(
  text: string,
  keywords: string[],
  minScore = 1
): string | null {
  const paragraphs = text.split(/\n{2,}|\n/).map((p) => p.trim()).filter((p) => p.length > 30);
  if (paragraphs.length === 0) return null;

  let best: { p: string; score: number } | null = null;
  for (const p of paragraphs) {
    const lower = p.toLowerCase();
    const score = keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
    if (score >= minScore && (!best || score > best.score)) {
      best = { p, score };
    }
  }

  return best?.p ?? paragraphs[0] ?? null;
}

export function findHighlightPhrase(sentence: string, keywords: string[]): string | undefined {
  for (const kw of keywords) {
    const idx = sentence.toLowerCase().indexOf(kw);
    if (idx >= 0) {
      const start = Math.max(0, sentence.lastIndexOf(" ", idx - 10) + 1);
      const end = sentence.indexOf(" ", idx + kw.length + 15);
      return sentence.slice(start, end > 0 ? end : undefined).trim();
    }
  }
  const words = sentence.split(/\s+/);
  if (words.length >= 3) return words.slice(0, 4).join(" ");
  return undefined;
}

export function detectBranchesInText(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    (lower.includes("mac") || lower.includes("macos")) &&
    (lower.includes("windows") || lower.includes("powershell"))
  );
}

export function detectPrerequisitesInText(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("prerequisite") ||
    lower.includes("before you begin") ||
    lower.includes("admin access") ||
    lower.includes("you will need")
  );
}

export function estimateStepsFromText(text: string, hasBranches: boolean): number {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const base = Math.min(12, Math.max(4, Math.round(wordCount / 400)));
  return hasBranches ? base + 1 : base;
}

export function estimateMinutes(stepCount: number): number {
  return Math.max(5, Math.round(stepCount * 1.5));
}
