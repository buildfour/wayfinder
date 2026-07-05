import type { ExtractTourRequest } from "../types";
import type { AgentTraceEntry, DistillerOutput, ReaderBrief } from "./types";
import { geminiJson, truncateSource } from "./gemini";
import { DISTILLER_AGENT_PROMPT, buildDistillerUserPrompt } from "./prompts";
import { extractTourHeuristic } from "../heuristic";

export async function runDistillerAgent(
  req: ExtractTourRequest,
  brief: ReaderBrief
): Promise<{ output: DistillerOutput; trace: AgentTraceEntry }> {
  try {
    const output = await geminiJson<DistillerOutput>(
      DISTILLER_AGENT_PROMPT,
      buildDistillerUserPrompt(
        req.goal,
        req.sourceTitle,
        truncateSource(req.sourceText),
        brief
      ),
      0.35
    );

    if (!output.steps?.length || output.steps.length < 2) {
      throw new Error("Distiller returned insufficient steps");
    }

    const simplified = output.steps.map((s) => ({
      ...s,
      headline: simplifyLine(s.headline),
      body: simplifyLine(s.body),
    }));

    return {
      output: { ...output, steps: simplified },
      trace: {
        agent: "distiller",
        label: "Distiller",
        summary:
          output.distilledPrinciples?.[0] ??
          `Distilled ${simplified.length} plain-language steps`,
      },
    };
  } catch {
    const fallback = extractTourHeuristic(req);
    const simplified = fallback.steps.map((s) => ({
      ...s,
      headline: simplifyLine(s.headline),
      body: simplifyLine(s.body),
    }));
    return {
      output: {
        distilledPrinciples: ["One clear action per step", "Jargon removed where possible"],
        steps: simplified,
      },
      trace: {
        agent: "distiller",
        label: "Distiller",
        summary: `Distilled ${simplified.length} steps (heuristic)`,
      },
    };
  }
}

function simplifyLine(text: string): string {
  return text
    .replace(/\b(utilize|leverage|facilitate)\b/gi, "use")
    .replace(/\b(commence|initiate)\b/gi, "start")
    .replace(/\b(terminate)\b/gi, "end")
    .replace(/\b(approximately)\b/gi, "about")
    .replace(/\s{2,}/g, " ")
    .trim();
}
