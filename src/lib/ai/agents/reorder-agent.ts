import type { TourStep } from "@/lib/types";
import type { ReorderAdvice, ReorderIssue, ReorderSuggestion } from "./types";
import { validateStepOrder as validateOrder, applyStepOrder } from "@/lib/tour-editor";
import { geminiJson } from "./gemini";
import { REORDER_AGENT_PROMPT, buildReorderUserPrompt } from "./prompts";

export { applyStepOrder };

const CHAPTER_RANK: Record<string, number> = {
  Prerequisites: 0,
  "Core Setup": 1,
  Verification: 2,
};

export async function runReorderAgent(
  goal: string,
  steps: TourStep[]
): Promise<ReorderAdvice> {
  try {
    const payload = steps.map((s) => ({
      id: s.id,
      type: s.type,
      chapter: s.chapter,
      headline: s.headline,
      branchId: s.branchId,
    }));

    const result = await geminiJson<{
      suggestions: ReorderSuggestion[];
      issues: ReorderIssue[];
    }>(REORDER_AGENT_PROMPT, buildReorderUserPrompt(goal, payload), 0.4);

    const suggestions = normalizeSuggestions(result.suggestions, steps);
    const localIssues = validateOrder(steps);
    const aiIssues = (result.issues ?? []).filter(
      (i) => !localIssues.some((v) => v.message === i.message)
    );

    return {
      suggestions:
        suggestions.length >= 3 ? suggestions.slice(0, 3) : buildHeuristicSuggestions(steps),
      issues: [...localIssues, ...aiIssues],
      method: "gemini",
    };
  } catch {
    return {
      suggestions: buildHeuristicSuggestions(steps),
      issues: validateOrder(steps),
      method: "heuristic",
    };
  }
}

export function validateStepOrder(steps: TourStep[]): ReorderIssue[] {
  return validateOrder(steps);
}

function normalizeSuggestions(
  raw: ReorderSuggestion[] | undefined,
  steps: TourStep[]
): ReorderSuggestion[] {
  const ids = steps.map((s) => s.id);
  const valid = (raw ?? []).filter((s) => {
    if (!s.stepIds || s.stepIds.length !== ids.length) return false;
    return ids.every((id) => s.stepIds.includes(id));
  });
  return valid;
}

export function buildHeuristicSuggestions(steps: TourStep[]): ReorderSuggestion[] {
  const ids = steps.map((s) => s.id);

  const byChapter = [...steps]
    .sort((a, b) => {
      const ra = CHAPTER_RANK[a.chapter ?? "Core Setup"] ?? 1;
      const rb = CHAPTER_RANK[b.chapter ?? "Core Setup"] ?? 1;
      if (ra !== rb) return ra - rb;
      if (a.type === "branch" && b.branchId) return -1;
      if (b.type === "branch" && a.branchId) return 1;
      return 0;
    })
    .map((s) => s.id);

  const checkpointsLast = [
    ...steps.filter((s) => s.type !== "checkpoint").map((s) => s.id),
    ...steps.filter((s) => s.type === "checkpoint").map((s) => s.id),
  ];

  const branchGrouped = groupBranchVariants(steps);

  const suggestions: ReorderSuggestion[] = [
    {
      id: "chapter-flow",
      label: "Chapter flow",
      rationale: "Prerequisites → setup → verification — the classic learning path.",
      stepIds: byChapter,
    },
    {
      id: "branch-grouped",
      label: "Branch grouped",
      rationale: "Keeps OS-specific steps tucked right after the branch junction.",
      stepIds: branchGrouped,
    },
    {
      id: "checkpoints-last",
      label: "Verify at end",
      rationale: "All setup first, then checkpoint gates before you finish.",
      stepIds: checkpointsLast,
    },
  ];

  return suggestions.filter((s, i, arr) => {
    const key = s.stepIds.join(",");
    return arr.findIndex((x) => x.stepIds.join(",") === key) === i;
  }).slice(0, 3);
}

function groupBranchVariants(steps: TourStep[]): string[] {
  const result: string[] = [];
  const used = new Set<string>();

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (used.has(step.id)) continue;

    if (step.type === "branch") {
      result.push(step.id);
      used.add(step.id);
      const variants = steps.filter((s) => s.branchId && !used.has(s.id));
      for (const v of variants) {
        result.push(v.id);
        used.add(v.id);
      }
      continue;
    }

    if (!step.branchId) {
      result.push(step.id);
      used.add(step.id);
    }
  }

  for (const step of steps) {
    if (!used.has(step.id)) result.push(step.id);
  }

  return result;
}

export function applyStepOrderFromIds(steps: TourStep[], stepIds: string[]): TourStep[] {
  return applyStepOrder(steps, stepIds);
}
