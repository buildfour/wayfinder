"use client";

import { create } from "zustand";
import type { Tour } from "@/lib/types";
import type { IngestStatus, ProcessingStage, SourceDocument } from "@/lib/ingest/types";
import { generateTourFromGoal } from "@/lib/tour-generator";
import { ingestUrl, ingestUpload, connectKbProvider } from "@/lib/ingest/client";
import { runProcessingPipeline } from "@/lib/ingest/pipeline";
import { publishTour } from "@/lib/publish/client";
import { useLibraryStore } from "@/store/library-store";

interface CreationState {
  resourceUrl: string;
  sourceDocument: SourceDocument | null;
  ingestStatus: IngestStatus;
  ingestError: string | null;
  goal: string;
  generatedTour: Tour | null;
  processingComplete: boolean;
  processingStage: ProcessingStage;
  extractionMethod: "openai" | "heuristic" | "template" | "gemini" | null;
  setResourceUrl: (url: string) => void;
  ingestFromUrl: (url: string) => Promise<boolean>;
  ingestFromFile: (file: File) => Promise<boolean>;
  connectKb: (providerId: string) => Promise<string | null>;
  setGoal: (goal: string) => void;
  runPipeline: () => Promise<Tour | null>;
  generateTour: () => Promise<Tour>;
  setGeneratedTour: (tour: Tour) => Promise<void>;
  setProcessingComplete: (value: boolean) => void;
  reset: () => void;
}

export const useCreationStore = create<CreationState>((set, get) => ({
  resourceUrl: "",
  sourceDocument: null,
  ingestStatus: "idle",
  ingestError: null,
  goal: "",
  generatedTour: null,
  processingComplete: false,
  processingStage: "reading",
  extractionMethod: null,

  setResourceUrl: (url) => set({ resourceUrl: url, ingestError: null }),

  ingestFromUrl: async (url) => {
    set({ ingestStatus: "loading", ingestError: null, resourceUrl: url });
    const result = await ingestUrl(url);
    if (!result.success || !result.document) {
      set({
        ingestStatus: "error",
        ingestError: result.error ?? "Failed to ingest URL",
        sourceDocument: null,
      });
      return false;
    }
    set({
      ingestStatus: "success",
      sourceDocument: result.document,
      ingestError: null,
    });
    return true;
  },

  ingestFromFile: async (file) => {
    set({ ingestStatus: "loading", ingestError: null });
    const result = await ingestUpload(file);
    if (!result.success || !result.document) {
      set({
        ingestStatus: "error",
        ingestError: result.error ?? "Failed to parse file",
        sourceDocument: null,
      });
      return false;
    }
    set({
      ingestStatus: "success",
      sourceDocument: result.document,
      resourceUrl: "",
      ingestError: null,
    });
    return true;
  },

  connectKb: async (providerId) => {
    set({ ingestStatus: "loading", ingestError: null });
    const result = await connectKbProvider(providerId);
    set({
      ingestStatus: "error",
      ingestError: result.message ?? "KB connect not available yet",
    });
    return result.oauthPlaceholder ?? null;
  },

  setGoal: (goal) =>
    set({
      goal,
      generatedTour: null,
      processingComplete: false,
    }),

  runPipeline: async () => {
    const { goal, sourceDocument } = get();
    set({ processingStage: "reading", processingComplete: false });

    try {
      const result = await runProcessingPipeline(
        goal || "Complete the setup guide",
        sourceDocument,
        (stage) => set({ processingStage: stage })
      );

      await useLibraryStore.getState().upsertTour(result.tour);
      await publishTour(result.tour);
      set({
        generatedTour: result.tour,
        processingComplete: true,
        processingStage: "complete",
        extractionMethod: result.extractionMethod,
      });
      return result.tour;
    } catch {
      set({ processingStage: "error", ingestError: "Tour generation failed" });
      return null;
    }
  },

  generateTour: async () => {
    const { goal, resourceUrl, sourceDocument } = get();
    const tour = generateTourFromGoal(
      goal || "Complete the setup guide",
      resourceUrl || sourceDocument?.sourceUrl,
      sourceDocument
    );
    await useLibraryStore.getState().upsertTour(tour);
    set({ generatedTour: tour, processingComplete: true });
    return tour;
  },

  setGeneratedTour: async (tour) => {
    await useLibraryStore.getState().upsertTour(tour);
    set({ generatedTour: tour });
  },

  setProcessingComplete: (value) => set({ processingComplete: value }),

  reset: () =>
    set({
      resourceUrl: "",
      sourceDocument: null,
      ingestStatus: "idle",
      ingestError: null,
      goal: "",
      generatedTour: null,
      processingComplete: false,
      processingStage: "reading",
      extractionMethod: null,
    }),
}));
