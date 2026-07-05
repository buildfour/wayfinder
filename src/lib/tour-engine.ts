import type { PreviewFrame, ResolvedTourStep, Tour, TourStep } from "./types";

/** Filter steps by branch and assign sequential numbers */
export function resolveTourSteps(
  steps: TourStep[],
  selectedBranch: string | null
): ResolvedTourStep[] {
  const filtered = steps.filter(
    (step) => !step.branchId || step.branchId === selectedBranch
  );

  return filtered.map((step, index) => ({
    ...step,
    number: index + 1,
  }));
}

export function getResolvedStep(
  steps: TourStep[],
  selectedBranch: string | null,
  index: number
): ResolvedTourStep | undefined {
  return resolveTourSteps(steps, selectedBranch)[index];
}

export function getResolvedStepCount(
  steps: TourStep[],
  selectedBranch: string | null
): number {
  return resolveTourSteps(steps, selectedBranch).length;
}

/** Build storyboard preview frames from tour steps (excludes branch-only variants) */
export function buildPreviewFrames(tour: Tour): PreviewFrame[] {
  const chapters = new Map<string, TourStep[]>();

  for (const step of tour.steps) {
    if (step.branchId) continue;
    const chapter = step.chapter ?? "Core Setup";
    if (!chapters.has(chapter)) chapters.set(chapter, []);
    chapters.get(chapter)!.push(step);
  }

  const frames: PreviewFrame[] = [];
  let index = 0;

  for (const [chapter, steps] of chapters) {
    for (const step of steps) {
      index += 1;
      frames.push({
        number: String(index).padStart(2, "0"),
        title: step.previewTitle ?? step.headline.split(".")[0].toUpperCase().slice(0, 28),
        description: step.previewDescription ?? step.body.slice(0, 80),
        chapter,
        hasBranch: step.type === "branch",
        hasCheckpoint: step.type === "checkpoint",
        stepId: step.id,
      });
    }
  }

  return frames;
}

export function groupPreviewByChapter(frames: PreviewFrame[]) {
  const groups = new Map<string, PreviewFrame[]>();
  for (const frame of frames) {
    if (!groups.has(frame.chapter)) groups.set(frame.chapter, []);
    groups.get(frame.chapter)!.push(frame);
  }
  return groups;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function detectOSBranch(): "macos" | "windows" | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "macos";
  if (ua.includes("win")) return "windows";
  return null;
}

export function computeElapsedMinutes(startTime: number): number {
  return Math.max(1, Math.round((Date.now() - startTime) / 60000));
}
