import type { ExtractedStepRaw } from "../types";
import type { AgentTraceEntry } from "./types";
import { geminiJson } from "./gemini";

const QUALITY_PROMPT = `You are the Quality ops agent in Wayfinder's AI system.

Review distilled tour steps for clarity:
- One action per step
- Plain language (8th-grade reading level)
- Headlines are imperative and under 12 words
- Bodies are 1-3 short sentences

Fix any step that fails these rules. Return the improved steps array unchanged in structure.
Respond with valid JSON only.`;

export async function runQualityAgent(
  steps: ExtractedStepRaw[]
): Promise<{ steps: ExtractedStepRaw[]; trace: AgentTraceEntry }> {
  try {
    const result = await geminiJson<{ steps: ExtractedStepRaw[]; notes?: string }>(
      QUALITY_PROMPT,
      JSON.stringify({ steps }, null, 2),
      0.2
    );
    if (!result.steps?.length) throw new Error("empty");
    return {
      steps: result.steps,
      trace: {
        agent: "quality",
        label: "Quality",
        summary: result.notes ?? "Clarity pass complete",
      },
    };
  } catch {
    return {
      steps: steps.map((s) => ({
        ...s,
        headline: s.headline.replace(/\.$/, ""),
        body: s.body.replace(/\b(utilize|leverage)\b/gi, "use"),
      })),
      trace: { agent: "quality", label: "Quality", summary: "Heuristic clarity pass" },
    };
  }
}
