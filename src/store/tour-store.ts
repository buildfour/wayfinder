"use client";

import { create } from "zustand";
import type { Tour, StuckReason } from "@/lib/types";
import {
  resolveTourSteps,
  computeElapsedMinutes,
  detectOSBranch,
} from "@/lib/tour-engine";
import {
  saveProgress,
  loadProgress,
  clearProgress,
  setActiveTourId,
} from "@/lib/storage";
import { fetchUserProgress, isAuthenticated, saveUserProgress } from "@/lib/user/client";

export type PlayerView =
  | "step"
  | "source"
  | "stuck"
  | "branch"
  | "checkpoint"
  | "complete";

interface TourState {
  tour: Tour | null;
  currentStepIndex: number;
  completedStepIds: string[];
  view: PlayerView;
  selectedBranch: string | null;
  stuckInput: string;
  stuckReason: StuckReason | null;
  showCheckpointDiagnostic: boolean;
  startTime: number | null;
  elapsedMinutes: number;
  initialized: boolean;

  loadTour: (tour: Tour, resume?: boolean) => Promise<void>;
  getActiveSteps: () => ReturnType<typeof resolveTourSteps>;
  setView: (view: PlayerView) => void;
  openStuck: (reason?: StuckReason) => void;
  nextStep: () => void;
  prevStep: () => void;
  completeStep: () => void;
  selectBranch: (branchId: string) => void;
  setStuckInput: (value: string) => void;
  setStuckReason: (reason: StuckReason) => void;
  showDiagnostic: () => void;
  skipStep: () => void;
  resetTour: () => void;
  persist: () => void;
}

function getInitialState() {
  return {
    tour: null as Tour | null,
    currentStepIndex: 0,
    completedStepIds: [] as string[],
    view: "step" as PlayerView,
    selectedBranch: null as string | null,
    stuckInput: "",
    stuckReason: null as StuckReason | null,
    showCheckpointDiagnostic: false,
    startTime: null as number | null,
    elapsedMinutes: 0,
    initialized: false,
  };
}

async function loadSavedProgress(tourId: string) {
  const local = loadProgress(tourId);
  if (local) return local;

  const authed = await isAuthenticated();
  if (!authed) return null;

  const result = await fetchUserProgress(tourId);
  if (result.success && result.progress) {
    return result.progress;
  }
  return null;
}

function syncProgress(state: ReturnType<typeof getInitialState> & { tour: Tour | null }) {
  if (!state.tour || !state.startTime) return;
  const progress = {
    tourId: state.tour.id,
    currentStepIndex: state.currentStepIndex,
    completedStepIds: state.completedStepIds,
    selectedBranch: state.selectedBranch,
    startTime: state.startTime,
    elapsedMinutes: computeElapsedMinutes(state.startTime),
    updatedAt: new Date().toISOString(),
  };
  saveProgress(progress);
  void isAuthenticated().then((authed) => {
    if (authed) void saveUserProgress(progress);
  });
}

export const useTourStore = create<TourState>((set, get) => ({
  ...getInitialState(),

  loadTour: async (tour, resume = true) => {
    setActiveTourId(tour.id);
    const saved = resume ? await loadSavedProgress(tour.id) : null;
    const autoBranch = detectOSBranch();

    if (saved && resume) {
      set({
        tour,
        currentStepIndex: saved.currentStepIndex,
        completedStepIds: saved.completedStepIds,
        selectedBranch: saved.selectedBranch,
        startTime: saved.startTime,
        elapsedMinutes: saved.elapsedMinutes,
        view: "step",
        stuckInput: "",
        stuckReason: null,
        showCheckpointDiagnostic: false,
        initialized: true,
      });
      return;
    }

    set({
      tour,
      currentStepIndex: 0,
      completedStepIds: [],
      selectedBranch: autoBranch,
      startTime: Date.now(),
      elapsedMinutes: 0,
      view: "step",
      stuckInput: "",
      stuckReason: null,
      showCheckpointDiagnostic: false,
      initialized: true,
    });
  },

  getActiveSteps: () => {
    const { tour, selectedBranch } = get();
    if (!tour) return [];
    return resolveTourSteps(tour.steps, selectedBranch);
  },

  setView: (view) => set({ view }),

  openStuck: (reason = "mismatch") =>
    set({ view: "stuck", stuckReason: reason }),

  persist: () => {
    syncProgress(get());
  },

  nextStep: () => {
    const state = get();
    const steps = state.getActiveSteps();
    const step = steps[state.currentStepIndex];
    if (!step) return;

    if (step.type === "branch" && !state.selectedBranch) {
      set({ view: "branch" });
      return;
    }
    if (step.type === "checkpoint") {
      set({ view: "checkpoint", showCheckpointDiagnostic: false });
      return;
    }

    const newCompleted = state.completedStepIds.includes(step.id)
      ? state.completedStepIds
      : [...state.completedStepIds, step.id];

    if (state.currentStepIndex >= steps.length - 1) {
      const elapsed = state.startTime
        ? computeElapsedMinutes(state.startTime)
        : 1;
      set({
        completedStepIds: newCompleted,
        view: "complete",
        elapsedMinutes: elapsed,
      });
      get().persist();
      return;
    }

    set({
      currentStepIndex: state.currentStepIndex + 1,
      completedStepIds: newCompleted,
      view: "step",
      stuckInput: "",
      stuckReason: null,
    });
    get().persist();
  },

  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({
        currentStepIndex: currentStepIndex - 1,
        view: "step",
        showCheckpointDiagnostic: false,
      });
      get().persist();
    }
  },

  completeStep: () => {
    const state = get();
    const steps = state.getActiveSteps();
    const step = steps[state.currentStepIndex];
    if (!step) return;

    const newCompleted = state.completedStepIds.includes(step.id)
      ? state.completedStepIds
      : [...state.completedStepIds, step.id];
    set({ completedStepIds: newCompleted, showCheckpointDiagnostic: false });
    get().nextStep();
  },

  selectBranch: (branchId) => {
    set({ selectedBranch: branchId, view: "step" });
    get().persist();
    get().nextStep();
  },

  setStuckInput: (value) => set({ stuckInput: value }),

  setStuckReason: (reason) => set({ stuckReason: reason }),

  showDiagnostic: () => set({ showCheckpointDiagnostic: true }),

  skipStep: () => {
    const state = get();
    const steps = state.getActiveSteps();
    if (state.currentStepIndex >= steps.length - 1) {
      const elapsed = state.startTime
        ? computeElapsedMinutes(state.startTime)
        : 1;
      set({ view: "complete", elapsedMinutes: elapsed });
    } else {
      set({
        currentStepIndex: state.currentStepIndex + 1,
        view: "step",
        stuckInput: "",
        stuckReason: null,
      });
    }
    get().persist();
  },

  resetTour: () => {
    const { tour } = get();
    if (tour) clearProgress(tour.id);
    set({
      ...getInitialState(),
      tour,
      startTime: Date.now(),
      initialized: true,
    });
  },
}));
