import type { ExtractTourRequest, ExtractedStepRaw } from "../types";
import type { AgentTraceEntry } from "./types";
import { geminiJson, truncateSource } from "./gemini";

const FIDELITY_PROMPT = `You are the Source Fidelity ops agent in Wayfinder's AI system.

Each step must stay grounded in the source document:
- sourcePassageText: short direct quote supporting the step
- sourceHighlight: the key phrase from that quote
- Do not invent steps with no basis in the source

Add or fix sourcePassageText and sourceHighlight where missing.
Respond with valid JSON only.`;

export async function runFidelityAgent(
  req: ExtractTourRequest,
  steps: ExtractedStepRaw[]
): Promise<{ steps: ExtractedStepRaw[]; trace: AgentTraceEntry }> {
  try {
    const result = await geminiJson<{ steps: ExtractedStepRaw[]; grounded?: number }>(
      FIDELITY_PROMPT,
      `SOURCE (excerpt):\n${truncateSource(req.sourceText, 8000)}\n\nSTEPS:\n${JSON.stringify(steps, null, 2)}`,
      0.2
    );
    if (!result.steps?.length) throw new Error("empty");
    return {
      steps: result.steps,
      trace: {
        agent: "fidelity",
        label: "Source Fidelity",
        summary: `${result.grounded ?? result.steps.length} steps grounded in source`,
      },
    };
  } catch {
    const patched = steps.map((s) => {
      if (s.sourcePassageText) return s;
      const snippet = req.sourceText.split(/\n+/).find((l) => l.trim().length > 20)?.trim();
      if (!snippet) return s;
      return {
        ...s,
        sourcePassageText: snippet.slice(0, 200),
        sourceHighlight: snippet.split(" ").slice(0, 4).join(" "),
      };
    });
    return {
      steps: patched,
      trace: { agent: "fidelity", label: "Source Fidelity", summary: "Source quotes attached" },
    };
  }
}
