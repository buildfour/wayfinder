import type { ExtractTourRequest } from "../types";
import type { AgentTraceEntry, DistillerOutput, OrderingOutput } from "./types";
import { geminiJson } from "./gemini";
import { ORDERING_AGENT_PROMPT, buildOrderingUserPrompt } from "./prompts";

const CHAPTER_RANK: Record<string, number> = {
  Prerequisites: 0,
  "Core Setup": 1,
  Verification: 2,
};

export async function runOrderingAgent(
  req: ExtractTourRequest,
  distillerOutput: DistillerOutput
): Promise<{ output: OrderingOutput; trace: AgentTraceEntry }> {
  try {
    const output = await geminiJson<OrderingOutput>(
      ORDERING_AGENT_PROMPT,
      buildOrderingUserPrompt(req.goal, distillerOutput),
      0.2
    );

    if (!output.steps?.length || output.steps.length < 2) {
      throw new Error("Ordering agent returned insufficient steps");
    }

    return {
      output,
      trace: {
        agent: "ordering",
        label: "Ordering",
        summary: output.orderingRationale || `Ordered ${output.steps.length} steps`,
      },
    };
  } catch {
    const ordered = orderHeuristic(distillerOutput);
    return {
      output: ordered,
      trace: {
        agent: "ordering",
        label: "Ordering",
        summary: ordered.orderingRationale,
      },
    };
  }
}

function orderHeuristic(distiller: DistillerOutput): OrderingOutput {
  const steps = [...distiller.steps].sort((a, b) => {
    const ra = CHAPTER_RANK[a.chapter ?? "Core Setup"] ?? 1;
    const rb = CHAPTER_RANK[b.chapter ?? "Core Setup"] ?? 1;
    if (ra !== rb) return ra - rb;
    if (a.type === "branch" && b.branchId) return -1;
    if (b.type === "branch" && a.branchId) return 1;
    return 0;
  });

  const branchCount = steps.filter((s) => s.type === "branch").length;

  return {
    title: distiller.steps[0]?.headline?.slice(0, 50) || "Your guided tour",
    estimatedMinutes: Math.max(5, Math.round(steps.filter((s) => !s.branchId).length * 1.5)),
    branchCount,
    steps,
    orderingRationale: "Prerequisites first, then setup, then verification",
  };
}
