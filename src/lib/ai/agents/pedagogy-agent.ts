import type { ExtractedStepRaw } from "../types";
import type { AgentTraceEntry } from "./types";
import { geminiJson } from "./gemini";

const PEDAGOGY_PROMPT = `You are the Pedagogy ops agent in Wayfinder's AI system.

Ensure steps teach in a logical learning sequence:
- Prerequisites before core setup before verification
- No conceptual leaps (each step builds on the previous)
- Checkpoints only after the user has done something verifiable

Reorder or re-chapter steps if needed. Keep the same number of steps unless merging duplicates.
Respond with valid JSON only.`;

export async function runPedagogyAgent(
  steps: ExtractedStepRaw[]
): Promise<{ steps: ExtractedStepRaw[]; trace: AgentTraceEntry }> {
  try {
    const result = await geminiJson<{ steps: ExtractedStepRaw[]; rationale?: string }>(
      PEDAGOGY_PROMPT,
      JSON.stringify({ steps }, null, 2),
      0.2
    );
    if (!result.steps?.length) throw new Error("empty");
    return {
      steps: result.steps,
      trace: {
        agent: "pedagogy",
        label: "Pedagogy",
        summary: result.rationale ?? "Learning sequence validated",
      },
    };
  } catch {
    const rank = { Prerequisites: 0, "Core Setup": 1, Verification: 2 };
    const sorted = [...steps].sort((a, b) => {
      const ra = rank[a.chapter as keyof typeof rank] ?? 1;
      const rb = rank[b.chapter as keyof typeof rank] ?? 1;
      return ra - rb;
    });
    return {
      steps: sorted,
      trace: { agent: "pedagogy", label: "Pedagogy", summary: "Chapter order enforced" },
    };
  }
}
