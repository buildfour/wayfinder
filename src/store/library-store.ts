"use client";

import { create } from "zustand";
import type { Tour } from "@/lib/types";
import {
  loadTours,
  saveTour,
  loadAllSavedMeta,
  getTourById,
  buildSavedTourMeta,
} from "@/lib/storage";
import type { SavedTourMeta } from "@/lib/types";
import { seedDefaultTour } from "@/lib/tour-generator";
import {
  fetchUserTours,
  saveUserTour,
  isAuthenticated,
  recordToProgress,
} from "@/lib/user/client";

interface LibraryState {
  tours: Tour[];
  meta: SavedTourMeta[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  upsertTour: (tour: Tour) => Promise<void>;
  getTour: (id: string) => Tour | undefined;
}

function ensureSeed(): Tour[] {
  let tours = loadTours();
  if (tours.length === 0) {
    const seed = seedDefaultTour();
    saveTour(seed);
    tours = [seed];
  }
  return tours;
}

function buildMetaFromApi(
  tours: Tour[],
  records: Array<{ id: string; updatedAt?: string; progress: UserTourRecordProgress | null }>
): SavedTourMeta[] {
  return tours.map((tour) => {
    const record = records.find((r) => r.id === tour.id);
    const progress = record ? recordToProgress(tour.id, record.progress) : null;
    const meta = buildSavedTourMeta(tour, progress);
    return record?.updatedAt ? { ...meta, updatedAt: record.updatedAt } : meta;
  });
}

type UserTourRecordProgress = {
  currentStepIndex: number;
  completedStepIds: string;
  selectedBranch: string | null;
  startTime: string;
  elapsedMinutes: number;
} | null;

export const useLibraryStore = create<LibraryState>((set, get) => ({
  tours: [],
  meta: [],
  hydrated: false,

  hydrate: async () => {
    const authed = await isAuthenticated();
    if (authed) {
      const result = await fetchUserTours();
      if (result.success && result.tours) {
        const records = result.records ?? [];
        set({
          tours: result.tours,
          meta: buildMetaFromApi(result.tours, records),
          hydrated: true,
        });
        return;
      }
    }

    const tours = ensureSeed();
    set({
      tours,
      meta: loadAllSavedMeta(),
      hydrated: true,
    });
  },

  upsertTour: async (tour) => {
    const authed = await isAuthenticated();
    if (authed) {
      await saveUserTour(tour);
    }
    saveTour(tour);
    const tours = loadTours();
    const idx = tours.findIndex((t) => t.id === tour.id);
    if (idx >= 0) tours[idx] = tour;
    else tours.push(tour);
    set({
      tours,
      meta: loadAllSavedMeta(),
    });
  },

  getTour: (id) => {
    const { tours } = get();
    return tours.find((t) => t.id === id) ?? getTourById(id);
  },
}));
