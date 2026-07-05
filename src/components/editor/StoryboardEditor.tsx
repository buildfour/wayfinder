"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { Tour, TourStep } from "@/lib/types";
import type { ReorderIssue } from "@/lib/ai/agents/types";
import {
  applyStepOrder,
  applyStepsToTour,
  buildStoryboardItems,
  insertStepAfter,
  reorderSteps,
  updateStepInTour,
  validateStepOrder,
} from "@/lib/tour-editor";
import { FilmFrame, StepEditPanel } from "./FilmFrame";
import { SourceMinimap } from "./SourceMinimap";
import { WinniePanel } from "@/components/winnie/WinniePanel";
import { AppHeader } from "@/components/layout/AppHeader";
import { FilmPerforations } from "@/components/layout/FilmPerforations";
import { StarChartGrid } from "@/components/layout/StarChart";

interface StoryboardEditorProps {
  tour: Tour;
  onTourChange: (tour: Tour) => void;
}

export function StoryboardEditor({ tour, onTourChange }: StoryboardEditorProps) {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(
    tour.steps[0]?.id ?? null
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [reorderIssues, setReorderIssues] = useState<ReorderIssue[]>([]);

  const items = buildStoryboardItems(tour.steps);
  const selectedStep = tour.steps.find((s) => s.id === selectedStepId) ?? null;

  const persist = useCallback(
    (steps: TourStep[]) => {
      onTourChange(applyStepsToTour(tour, steps));
    },
    [tour, onTourChange]
  );

  const handleUpdateStep = (stepId: string, updates: Partial<TourStep>) => {
    onTourChange(updateStepInTour(tour, stepId, updates));
  };

  const handleReorder = (from: number, to: number) => {
    const next = reorderSteps(tour.steps, from, to);
    persist(next);
    setReorderIssues(validateStepOrder(next));
    setDragIndex(null);
    setDropIndex(null);
  };

  const handleApplyWinnieOrder = (stepIds: string[]) => {
    const next = applyStepOrder(tour.steps, stepIds);
    if (next.length === tour.steps.length) {
      persist(next);
      setReorderIssues(validateStepOrder(next));
    }
  };

  const handleInsertAfter = (index: number) => {
    const steps = insertStepAfter(tour.steps, index);
    persist(steps);
    const newStep = steps[index + 1];
    if (newStep) setSelectedStepId(newStep.id);
  };

  // Group items by chapter for chapter markers above rail
  const rail = (
    <div className="relative">
      <div className="mb-3 flex items-center gap-2">
        <span className="font-[family-name:var(--font-bebas)] text-[10px] tracking-[0.25em] text-muted">
          STORYBOARD
        </span>
        <div className="h-px flex-1 bg-parchment/10" />
        <span className="font-[family-name:var(--font-mono)] text-[10px] text-muted">
          {items.length} frames · drag to reorder
          {reorderIssues.length > 0 && (
            <span className="ml-2 text-amber">· {reorderIssues.length} note{reorderIssues.length > 1 ? "s" : ""} from Winnie</span>
          )}
        </span>
      </div>

      <div className="flex overflow-x-auto pb-8 pt-10 scrollbar-thin">
        {items.map((item, i) => (
          <FilmFrame
            key={item.step.id}
            item={item}
            selected={item.step.id === selectedStepId}
            isFirst={i === 0}
            dragOver={dropIndex === item.index && dragIndex !== item.index}
            onSelect={() => setSelectedStepId(item.step.id)}
            onDragStart={() => setDragIndex(item.index)}
            onDragEnd={() => {
              setDragIndex(null);
              setDropIndex(null);
            }}
            onDragOver={() => {
              if (dragIndex !== null) setDropIndex(item.index);
            }}
            onDrop={() => {
              if (dragIndex !== null) handleReorder(dragIndex, item.index);
            }}
            onInsertAfter={() => handleInsertAfter(item.index)}
          />
        ))}

        {/* Trailing add */}
        <div className="flex shrink-0 items-center pl-4">
          <button
            type="button"
            onClick={() => handleInsertAfter(tour.steps.length - 1)}
            className="flex h-16 w-16 items-center justify-center border border-dashed border-parchment/15 text-muted transition-colors hover:border-teal/40 hover:text-teal-bright"
            aria-label="Add step at end"
          >
            +
          </button>
        </div>
      </div>

      {/* Fork track legend */}
      {tour.branchCount > 0 && (
        <div className="mt-2 flex items-center gap-4 text-[10px] text-muted">
          <span className="text-amber">⑂</span> Branch junction
          <span className="text-cobalt-bright">↳</span> Branch path variant
          <span className="text-teal">│</span> Checkpoint gate
        </div>
      )}
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-void film-grain">
      <StarChartGrid className="opacity-25" />
      <AppHeader showNewTour showCompass />

      <main className="flex min-h-[calc(100vh-80px)]">
        <div className="flex flex-1 flex-col overflow-hidden px-6 py-8 md:px-10">
          {rail}

          <AnimatePresence mode="wait">
            {selectedStep && (
              <StepEditPanel
                key={selectedStep.id}
                step={selectedStep}
                onUpdate={(updates) => handleUpdateStep(selectedStep.id, updates)}
                onClose={() => setSelectedStepId(null)}
              />
            )}
          </AnimatePresence>
        </div>

        <aside className="hidden w-72 shrink-0 flex-col gap-4 border-l border-parchment/10 bg-sidebar/50 p-4 lg:flex">
          <WinniePanel
            goal={tour.goal}
            steps={tour.steps}
            onApplyOrder={handleApplyWinnieOrder}
            onReorderFeedback={setReorderIssues}
          />

          <SourceMinimap
            steps={tour.steps}
            selectedStepId={selectedStepId}
            sourceTitle={tour.sourceTitle}
          />

          <Link
            href={`/tour/${tour.id}/play`}
            className="mt-auto flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber to-amber-bright py-3 font-[family-name:var(--font-bebas)] text-sm tracking-wider text-void glow-amber"
          >
            RUN TOUR →
          </Link>
        </aside>
      </main>

      <div className="px-6 pb-8 lg:hidden">
        <Link
          href={`/tour/${tour.id}/play`}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber to-amber-bright py-3 font-[family-name:var(--font-bebas)] text-sm tracking-wider text-void"
        >
          RUN TOUR →
        </Link>
      </div>

      <FilmPerforations className="absolute bottom-0 left-0 right-0" />
    </div>
  );
}
