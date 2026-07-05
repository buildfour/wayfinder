import type { TourStep } from "@/lib/types";
import type { ReorderAdvice } from "@/lib/ai/agents/types";

export async function fetchReorderAdvice(
  goal: string,
  steps: TourStep[]
): Promise<ReorderAdvice | null> {
  const res = await fetch("/api/agents/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal, steps }),
  });
  const json = await res.json();
  if (!json.success) return null;
  return json.advice as ReorderAdvice;
}
