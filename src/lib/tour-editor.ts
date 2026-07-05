import type { Tour, TourStep } from "./types";

export interface StoryboardItem {
  step: TourStep;
  index: number;
  displayNumber: string;
  isBranchFork: boolean;
  branchLabel?: string;
  forkGroupId?: string;
}

/** Build ordered storyboard items including branch variant labels */
export function buildStoryboardItems(steps: TourStep[]): StoryboardItem[] {
  const items: StoryboardItem[] = [];
  let displayNum = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (step.branchId) {
      displayNum += 1;
      items.push({
        step,
        index: i,
        displayNumber: String(displayNum).padStart(2, "0"),
        isBranchFork: true,
        branchLabel: step.branchId === "macos" ? "macOS" : step.branchId === "windows" ? "Windows" : step.branchId,
        forkGroupId: findBranchParentId(steps, i),
      });
    } else {
      displayNum += 1;
      items.push({
        step,
        index: i,
        displayNumber: String(displayNum).padStart(2, "0"),
        isBranchFork: step.type === "branch",
      });
    }
  }

  return items;
}

function findBranchParentId(steps: TourStep[], branchStepIndex: number): string | undefined {
  for (let i = branchStepIndex - 1; i >= 0; i--) {
    if (steps[i].type === "branch") return steps[i].id;
  }
  return undefined;
}

export function createBlankStep(afterStep?: TourStep): TourStep {
  const chapter = afterStep?.chapter ?? "Core Setup";
  const id = `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    type: "instruction",
    chapter,
    headline: "Describe the next action.",
    body: "Add clear, actionable instructions for this step.",
    previewTitle: "NEW STEP",
    previewDescription: "Add clear, actionable instructions for this step.",
    sourceAnchor: 0.5,
  };
}

export function reorderSteps(steps: TourStep[], fromIndex: number, toIndex: number): TourStep[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return steps;
  const next = [...steps];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function insertStepAfter(steps: TourStep[], afterIndex: number, step?: TourStep): TourStep[] {
  const newStep = step ?? createBlankStep(steps[afterIndex]);
  const next = [...steps];
  next.splice(afterIndex + 1, 0, newStep);
  return next;
}

export function updateStepInTour(
  tour: Tour,
  stepId: string,
  updates: Partial<TourStep>
): Tour {
  return {
    ...tour,
    steps: tour.steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)),
  };
}

export function applyStepsToTour(tour: Tour, steps: TourStep[]): Tour {
  const branchCount = steps.filter((s) => s.type === "branch").length;
  const mainSteps = steps.filter((s) => !s.branchId);
  return {
    ...tour,
    steps,
    estimatedMinutes: Math.max(5, Math.round(mainSteps.length * 1.5)),
    branchCount,
  };
}

const CHAPTER_RANK: Record<string, number> = {
  Prerequisites: 0,
  "Core Setup": 1,
  Verification: 2,
};

export interface StepOrderIssue {
  severity: "warning" | "info";
  message: string;
  recommendation: string;
  affectedStepIds?: string[];
}

/** Client-safe reorder validation — no AI required */
export function validateStepOrder(steps: TourStep[]): StepOrderIssue[] {
  const issues: StepOrderIssue[] = [];
  if (steps.length === 0) return issues;

  if (steps[0]?.type === "checkpoint") {
    issues.push({
      severity: "warning",
      message: "Tour starts with a checkpoint before any setup steps.",
      recommendation: "Move setup instructions before verification checkpoints.",
      affectedStepIds: [steps[0].id],
    });
  }

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const chapterRank = CHAPTER_RANK[step.chapter ?? "Core Setup"] ?? 1;

    for (let j = i + 1; j < steps.length; j++) {
      const later = steps[j];
      const laterRank = CHAPTER_RANK[later.chapter ?? "Core Setup"] ?? 1;
      if (laterRank < chapterRank && later.chapter && step.chapter) {
        issues.push({
          severity: "warning",
          message: `"${later.headline}" (${later.chapter}) appears after later-stage steps.`,
          recommendation: `Consider moving "${later.headline}" earlier — ${later.chapter} usually comes first.`,
          affectedStepIds: [later.id, step.id],
        });
        break;
      }
    }

    if (step.branchId) {
      let branchParentIndex = -1;
      for (let j = i - 1; j >= 0; j--) {
        if (steps[j].type === "branch") {
          branchParentIndex = j;
          break;
        }
      }
      if (branchParentIndex < 0) {
        issues.push({
          severity: "warning",
          message: `Branch step "${step.headline}" is far from its OS junction.`,
          recommendation: "Keep macOS/Windows variants directly after the branch choice step.",
          affectedStepIds: [step.id],
        });
      } else if (i - branchParentIndex > 3) {
        issues.push({
          severity: "info",
          message: `Gap between branch junction and "${step.headline}".`,
          recommendation: "Group branch variants together so users don't miss their path.",
          affectedStepIds: [step.id],
        });
      }
    }
  }

  const seen = new Set<string>();
  return issues.filter((issue) => {
    if (seen.has(issue.message)) return false;
    seen.add(issue.message);
    return true;
  });
}

export function applyStepOrder(steps: TourStep[], stepIds: string[]): TourStep[] {
  const map = new Map(steps.map((s) => [s.id, s]));
  return stepIds.map((id) => map.get(id)).filter((s): s is TourStep => !!s);
}

/** Source minimap anchor 0–1; uses sourceAnchor or falls back to position in rail */
export function getSourceAnchor(steps: TourStep[], stepId: string): number {
  const editable = steps.filter((s) => !s.branchId || s.type === "branch");
  const idx = steps.findIndex((s) => s.id === stepId);
  const step = steps[idx];
  if (step?.sourceAnchor != null) return step.sourceAnchor;
  if (idx < 0) return 0.5;
  return (idx + 1) / (steps.length + 1);
}
