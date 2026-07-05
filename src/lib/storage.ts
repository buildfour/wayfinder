import type { Tour, TourProgress, SavedTourMeta } from "./types";

const TOURS_KEY = "wayfinder:tours";
const PROGRESS_KEY = "wayfinder:progress";
const ACTIVE_TOUR_KEY = "wayfinder:active-tour";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadTours(): Tour[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(TOURS_KEY);
    return raw ? (JSON.parse(raw) as Tour[]) : [];
  } catch {
    return [];
  }
}

export function saveTour(tour: Tour): void {
  if (!isBrowser()) return;
  const tours = loadTours();
  const idx = tours.findIndex((t) => t.id === tour.id);
  if (idx >= 0) tours[idx] = tour;
  else tours.push(tour);
  localStorage.setItem(TOURS_KEY, JSON.stringify(tours));
}

export function getTourById(id: string): Tour | undefined {
  return loadTours().find((t) => t.id === id);
}

export function loadProgress(tourId: string): TourProgress | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(`${PROGRESS_KEY}:${tourId}`);
    return raw ? (JSON.parse(raw) as TourProgress) : null;
  } catch {
    return null;
  }
}

export function saveProgress(progress: TourProgress): void {
  if (!isBrowser()) return;
  localStorage.setItem(
    `${PROGRESS_KEY}:${progress.tourId}`,
    JSON.stringify(progress)
  );
}

export function clearProgress(tourId: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(`${PROGRESS_KEY}:${tourId}`);
}

export function setActiveTourId(id: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(ACTIVE_TOUR_KEY, id);
}

export function getActiveTourId(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACTIVE_TOUR_KEY);
}

export function buildSavedTourMeta(
  tour: Tour,
  progress: TourProgress | null
): SavedTourMeta {
  const stepCount = tour.steps.filter((s) => !s.branchId).length;
  const completed = progress?.completedStepIds.length ?? 0;
  return {
    id: tour.id,
    title: tour.title,
    source: tour.sourceTitle,
    goal: tour.goal,
    stepCount,
    progress: stepCount > 0 ? completed / stepCount : 0,
    lastVisitedStep: (progress?.currentStepIndex ?? 0) + 1,
    updatedAt: progress?.updatedAt ?? new Date(0).toISOString(),
  };
}

export function loadAllSavedMeta(): SavedTourMeta[] {
  return loadTours().map((tour) => buildSavedTourMeta(tour, loadProgress(tour.id)));
}

export function getShareUrl(tourId: string): string {
  if (!isBrowser()) return `https://wayfinder.io/tour/${tourId}`;
  return `${window.location.origin}/tour/${tourId}`;
}
