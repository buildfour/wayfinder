"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { StoryboardItem } from "@/lib/tour-editor";
import type { TourStep } from "@/lib/types";

interface FilmFrameProps {
  item: StoryboardItem;
  selected: boolean;
  isFirst: boolean;
  dragOver: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onInsertAfter: () => void;
}

export function FilmFrame({
  item,
  selected,
  isFirst,
  dragOver,
  onSelect,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onInsertAfter,
}: FilmFrameProps) {
  const [hovered, setHovered] = useState(false);
  const { step, displayNumber, isBranchFork, branchLabel } = item;
  const title = step.previewTitle ?? step.headline.split(".")[0].toUpperCase().slice(0, 28);
  const description = step.previewDescription ?? step.body.slice(0, 80);

  return (
    <div
      className="group relative flex shrink-0 items-stretch"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Add step glyph between frames */}
      {!isFirst && (
        <div className="relative flex w-8 shrink-0 items-center justify-center">
          <button
            type="button"
            onClick={onInsertAfter}
            className={`absolute z-10 flex h-6 w-6 items-center justify-center rounded-full border text-xs transition-all ${
              hovered
                ? "border-teal/50 bg-teal/10 text-teal-bright opacity-100 scale-100"
                : "border-transparent opacity-0 scale-75 pointer-events-none"
            }`}
            aria-label="Add step"
          >
            +
          </button>
          {item.forkGroupId && branchLabel && (
            <div className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-teal/20" />
          )}
        </div>
      )}

      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          onDragStart();
        }}
        onDragEnd={onDragEnd}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver(e);
        }}
        onDrop={(e) => {
          e.preventDefault();
          onDrop();
        }}
        onClick={onSelect}
        className={`relative w-[220px] cursor-grab border p-5 transition-all active:cursor-grabbing ${
          dragOver
            ? "border-teal scale-[1.02]"
            : selected
              ? "border-cobalt-bright glow-cobalt bg-charcoal/50"
              : "border-parchment/10 bg-charcoal/20 hover:border-parchment/25"
        } ${branchLabel ? "mt-6" : ""}`}
      >
        {step.chapter && (
          <span className="absolute -top-8 left-0 font-[family-name:var(--font-bebas)] text-[9px] tracking-wider text-teal/70">
            {step.chapter.toUpperCase()}
          </span>
        )}

        {branchLabel && (
          <span className="absolute -top-5 left-0 font-[family-name:var(--font-mono)] text-[9px] text-cobalt-bright">
            ↳ {branchLabel}
          </span>
        )}

        <span className="font-[family-name:var(--font-mono)] text-[10px] text-muted">
          {displayNumber}
        </span>

        <h3 className="mt-2 font-[family-name:var(--font-bebas)] text-sm tracking-wider text-parchment leading-tight">
          {title}
        </h3>
        <p className="mt-2 text-xs text-muted leading-relaxed line-clamp-3">{description}</p>

        <div className="mt-6 flex gap-1">
          <div className="h-px w-4 bg-parchment/10" />
          <div className="h-px w-4 bg-parchment/10" />
        </div>

        {step.type === "branch" && (
          <div className="absolute bottom-3 right-3 text-amber text-sm" title="Branch fork">
            ⑂
          </div>
        )}
        {step.type === "checkpoint" && (
          <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-teal/50" title="Checkpoint gate" />
        )}

        {isBranchFork && step.type === "branch" && (
          <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 gap-3">
            <div className="h-3 w-px bg-teal/40 rotate-[25deg] origin-top" />
            <div className="h-3 w-px bg-amber/40 -rotate-[25deg] origin-top" />
          </div>
        )}
      </div>
    </div>
  );
}

interface StepEditPanelProps {
  step: TourStep;
  onUpdate: (updates: Partial<TourStep>) => void;
  onClose: () => void;
}

export function StepEditPanel({ step, onUpdate, onClose }: StepEditPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="mt-6 rounded border border-cobalt/30 bg-charcoal/40 p-6 glow-cobalt"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="font-[family-name:var(--font-bebas)] text-xs tracking-[0.2em] text-teal">
          EDIT FRAME · {step.previewTitle ?? step.id}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted hover:text-parchment"
        >
          ↓ Collapse
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[10px] text-muted tracking-wider">HEADLINE</span>
          <input
            value={step.headline}
            onChange={(e) => onUpdate({ headline: e.target.value })}
            className="w-full border-b border-parchment/20 bg-transparent py-2 text-sm text-parchment focus:border-teal focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] text-muted tracking-wider">PREVIEW TITLE</span>
          <input
            value={step.previewTitle ?? ""}
            onChange={(e) => onUpdate({ previewTitle: e.target.value })}
            className="w-full border-b border-parchment/20 bg-transparent py-2 font-[family-name:var(--font-bebas)] text-sm tracking-wider text-parchment focus:border-teal focus:outline-none"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-[10px] text-muted tracking-wider">INSTRUCTION BODY</span>
        <textarea
          value={step.body}
          onChange={(e) => onUpdate({ body: e.target.value, previewDescription: e.target.value.slice(0, 80) })}
          rows={3}
          className="w-full resize-none border border-parchment/10 bg-void/50 p-3 text-sm text-parchment leading-relaxed focus:border-teal focus:outline-none"
        />
      </label>

      <label className="mt-4 block max-w-xs">
        <span className="mb-1 block text-[10px] text-muted tracking-wider">CHAPTER</span>
        <input
          value={step.chapter ?? ""}
          onChange={(e) => onUpdate({ chapter: e.target.value })}
          className="w-full border-b border-parchment/20 bg-transparent py-2 text-sm text-parchment focus:border-teal focus:outline-none"
        />
      </label>
    </motion.div>
  );
}
