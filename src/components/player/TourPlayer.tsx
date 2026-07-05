"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTourStore } from "@/store/tour-store";
import { useWinnieStore } from "@/store/winnie-store";
import { useVoiceNarration } from "@/hooks/useVoiceNarration";
import { CompletionScreen } from "@/components/player/CompletionScreen";
import { ConstellationProgress, StarChartGrid } from "@/components/layout/StarChart";
import { FilmPerforations } from "@/components/layout/FilmPerforations";
import { Wordmark } from "@/components/layout/Wordmark";
import type { ResolvedTourStep, StuckReason, Tour } from "@/lib/types";

const STUCK_OPTIONS: { label: string; reason: StuckReason }[] = [
  { label: "This doesn't match what I see", reason: "mismatch" },
  { label: "I don't understand this step", reason: "confused" },
  { label: "I already did this", reason: "alreadyDone" },
];

export function TourPlayer() {
  const {
    tour,
    currentStepIndex,
    completedStepIds,
    view,
    stuckInput,
    stuckReason,
    showCheckpointDiagnostic,
    setView,
    openStuck,
    nextStep,
    prevStep,
    completeStep,
    selectBranch,
    setStuckInput,
    setStuckReason,
    showDiagnostic,
    skipStep,
    resetTour,
    elapsedMinutes,
    getActiveSteps,
    initialized,
  } = useTourStore();

  const voiceEnabled = useWinnieStore((s) => s.voiceEnabled);
  const setVoiceEnabled = useWinnieStore((s) => s.setVoiceEnabled);
  const { speak, stop, speaking, available: voiceAvailable } = useVoiceNarration(voiceEnabled);

  const activeSteps = initialized && tour ? getActiveSteps() : [];
  const step = activeSteps[currentStepIndex];

  useEffect(() => {
    if (!voiceEnabled || !step || view !== "step") return;
    const narration = `${step.headline}. ${step.body}`;
    speak(narration);
    return () => stop();
  }, [step?.id, voiceEnabled, view, speak, stop]);

  if (!initialized || !tour) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <p className="text-muted">Loading tour…</p>
      </div>
    );
  }

  const totalSteps = activeSteps.length;

  const completedIndices = activeSteps
    .map((s, i) => (completedStepIds.includes(s.id) ? i : -1))
    .filter((i) => i >= 0);

  if (view === "complete") {
    return (
      <CompletionScreen
        tour={tour}
        totalSteps={totalSteps}
        completedIndices={activeSteps.map((_, i) => i)}
        elapsedMinutes={elapsedMinutes}
        onReplay={resetTour}
      />
    );
  }

  if (!step) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <p className="text-muted">Tour step not found.</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen bg-void film-grain">
      <StarChartGrid />

      {/* Main stage */}
      <div className={`relative flex flex-1 flex-col transition-all duration-500 ${view === "stuck" ? "brightness-75" : ""}`}>
        <header className="relative z-20 flex items-center justify-between px-6 py-5 md:px-10">
          <Wordmark href="/dashboard" />
          <div className="flex items-center gap-4">
            {voiceAvailable && (
              <button
                type="button"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`font-[family-name:var(--font-mono)] text-[10px] tracking-wider ${
                  voiceEnabled ? "text-teal" : "text-muted"
                }`}
                title={voiceEnabled ? "Voice guide on" : "Voice guide off"}
              >
                {speaking ? "◉ VOICE" : voiceEnabled ? "🔊 VOICE" : "🔇 VOICE"}
              </button>
            )}
            <Link
              href="/dashboard"
              className="font-[family-name:var(--font-bebas)] text-xs tracking-[0.2em] text-amber flex items-center gap-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber" />
              OVERVIEW
            </Link>
          </div>
        </header>

        {/* Progress constellation */}
        <div className="relative z-10 px-6 py-4">
          <ConstellationProgress
            total={totalSteps}
            current={currentStepIndex}
            completed={completedIndices}
          />
        </div>

        {/* Branch choice */}
        <AnimatePresence mode="wait">
          {view === "branch" && step.branchOptions ? (
            <BranchChoice
              key="branch"
              options={step.branchOptions}
              onSelect={selectBranch}
            />
          ) : view === "checkpoint" ? (
            <CheckpointGate
              key="checkpoint"
              step={step}
              showDiagnostic={showCheckpointDiagnostic}
              onYes={completeStep}
              onNo={showDiagnostic}
            />
          ) : (
            <motion.div
              key={`step-${currentStepIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-32 pt-8"
            >
              {step.chapter && view === "step" && (
                <p className="mb-4 text-xs text-muted">{step.chapter}</p>
              )}

              <span className="absolute left-6 top-24 font-[family-name:var(--font-mono)] text-xs text-amber md:left-10">
                {String(step.number).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
              </span>

              <h1 className="max-w-2xl text-center font-[family-name:var(--font-dm-sans)] text-2xl font-light leading-tight text-parchment md:text-4xl text-glow-amber">
                {step.headline}
              </h1>

              <p className="mt-8 max-w-xl text-center text-sm leading-relaxed text-muted md:text-base">
                {step.body}
              </p>

              {step.sourcePassage && view === "step" && (
                <button
                  onClick={() => setView("source")}
                  className="mt-10 flex items-center gap-2 text-xs tracking-wider text-teal-bright hover:text-teal"
                >
                  <span>⌁</span> SOURCE PASSAGE
                </button>
              )}

              {/* Source passage panel (bottom lift) */}
              <AnimatePresence>
                {view === "source" && step.sourcePassage && (
                  <SourcePassagePanel
                    passage={step.sourcePassage}
                    onClose={() => setView("step")}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom navigation */}
        {view !== "branch" && view !== "checkpoint" && view !== "source" && (
          <nav className="relative z-20 flex items-center justify-between border-t border-parchment/5 px-6 py-6 md:px-10">
            <button
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2 font-[family-name:var(--font-bebas)] text-xs tracking-[0.2em] text-muted hover:text-parchment disabled:opacity-30"
            >
              ← BACK
            </button>

            <button
              onClick={() => openStuck()}
              className="text-xs text-muted/50 hover:text-muted"
            >
              I&apos;m stuck
            </button>

            <button
              onClick={nextStep}
              className="flex items-center gap-2 border-b border-amber font-[family-name:var(--font-bebas)] text-xs tracking-[0.2em] text-amber hover:text-amber-bright"
            >
              DONE, NEXT STEP →
            </button>
          </nav>
        )}

        <FilmPerforations className="absolute bottom-0 left-0 right-0" />
      </div>

      {/* Stuck panel */}
      <AnimatePresence>
        {view === "stuck" && step && (
          <StuckPanel
            step={step}
            input={stuckInput}
            reason={stuckReason}
            onInputChange={setStuckInput}
            onSelectReason={setStuckReason}
            onTryAgain={() => setView("step")}
            onSkip={skipStep}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SourcePassagePanel({
  passage,
  onClose,
}: {
  passage: NonNullable<import("@/lib/types").TourStep["sourcePassage"]>;
  onClose: () => void;
}) {
  const parts = passage.highlight
    ? passage.text.split(passage.highlight)
    : [passage.text];

  return (
    <>
      <div className="fixed inset-0 z-30 bg-void/60" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-cobalt-bright/40 bg-charcoal/95 p-8 glow-cobalt md:left-8 md:right-8 md:rounded-t-lg"
      >
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between">
            <span className="font-[family-name:var(--font-bebas)] text-xs tracking-[0.2em] text-amber">
              FROM THE SOURCE
            </span>
            <button
              onClick={onClose}
              className="text-xs text-teal-bright hover:text-teal"
            >
              ↓ BACK TO STEP
            </button>
          </div>
          <p className="font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-parchment/80">
            &ldquo;
            {parts[0]}
            {passage.highlight && (
              <span className="underline decoration-amber decoration-1 underline-offset-4">
                {passage.highlight}
              </span>
            )}
            {parts[1]}
            &rdquo;
          </p>
          <p className="mt-4 text-xs text-muted">
            {passage.attribution} · {passage.section}
          </p>
        </div>
      </motion.div>
    </>
  );
}

function StuckPanel({
  step,
  input,
  reason,
  onInputChange,
  onSelectReason,
  onTryAgain,
  onSkip,
}: {
  step: ResolvedTourStep;
  input: string;
  reason: StuckReason | null;
  onInputChange: (v: string) => void;
  onSelectReason: (r: StuckReason) => void;
  onTryAgain: () => void;
  onSkip: () => void;
}) {
  const activeReason = reason ?? "mismatch";
  const help = step.stuckHelp?.[activeReason];

  return (
    <motion.aside
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-cobalt-bright/30 bg-sidebar p-8 glow-cobalt md:relative md:w-80 lg:w-96"
    >
      <h2 className="mb-8 font-[family-name:var(--font-bebas)] text-xs tracking-[0.25em] text-amber-bright">
        WHAT&apos;S HAPPENING?
      </h2>

      <div className="space-y-3">
        {STUCK_OPTIONS.map((opt) => (
          <button
            key={opt.reason}
            onClick={() => onSelectReason(opt.reason)}
            className={`w-full border px-4 py-4 text-left text-sm transition-colors ${
              activeReason === opt.reason
                ? "border-cobalt/50 bg-charcoal/70 text-parchment"
                : "border-parchment/15 bg-charcoal/50 text-parchment/90 hover:border-cobalt/40"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Describe what you're seeing…"
          className="w-full border-b border-parchment/20 bg-transparent pb-2 text-sm text-parchment placeholder:text-muted focus:border-teal focus:outline-none"
        />
      </div>

      {help && (
        <div className="mt-6 rounded border border-teal/20 bg-teal/5 p-4">
          <p className="text-sm leading-relaxed text-teal-bright">
            <span className="font-medium">Wayfinder:</span> {help.message}
          </p>
          {help.quote && (
            <p className="mt-3 text-xs italic text-muted">
              &ldquo;{help.quote}&rdquo;
            </p>
          )}
          {input.trim() && (
            <p className="mt-3 text-xs text-parchment/60">
              Re-checking source for: &ldquo;{input.trim()}&rdquo;
            </p>
          )}
        </div>
      )}

      <div className="mt-auto space-y-4 pt-8">
        <button
          onClick={onTryAgain}
          className="w-full rounded bg-cobalt-bright py-3 font-[family-name:var(--font-bebas)] text-sm tracking-[0.15em] text-white hover:bg-cobalt transition-colors"
        >
          TRY AGAIN
        </button>
        <button
          onClick={onSkip}
          className="w-full text-center font-[family-name:var(--font-bebas)] text-xs tracking-[0.2em] text-muted hover:text-parchment"
        >
          SKIP THIS STEP
        </button>
      </div>
    </motion.aside>
  );
}

function BranchChoice({
  options,
  onSelect,
}: {
  options: NonNullable<import("@/lib/types").TourStep["branchOptions"]>;
  onSelect: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-20"
    >
      <p className="mb-12 font-[family-name:var(--font-bebas)] text-xs tracking-[0.3em] text-teal-bright">
        ONE QUICK QUESTION:
      </p>

      <div className="flex w-full max-w-3xl flex-col gap-6 md:flex-row md:gap-8">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={`group relative flex-1 border p-8 text-left transition-all hover:scale-[1.02] ${
              opt.accent === "cobalt"
                ? "border-cobalt-bright/50 bg-gradient-to-b from-cobalt/10 to-transparent glow-cobalt"
                : "border-amber-bright/50 bg-gradient-to-b from-amber/10 to-transparent glow-amber"
            }`}
          >
            <h3 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wider text-parchment md:text-5xl">
              {opt.label}
            </h3>
            <p className="mt-4 font-[family-name:var(--font-source-serif)] text-sm italic text-parchment/80">
              {opt.description}
            </p>
            <span
              className={`mt-8 inline-block font-[family-name:var(--font-bebas)] text-xs tracking-wider ${
                opt.accent === "cobalt" ? "text-cobalt-bright" : "text-amber-bright"
              }`}
            >
              {opt.cta}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function CheckpointGate({
  step,
  showDiagnostic,
  onYes,
  onNo,
}: {
  step: ResolvedTourStep;
  showDiagnostic: boolean;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative z-10 flex flex-1 flex-col items-center justify-center px-6"
    >
      <div className="absolute inset-0 bg-void/50" />

      <div className="relative z-10 max-w-xl text-center">
        <p className="mb-2 text-xs text-muted">{step.chapter ?? "Verification"}</p>

        <div className="relative my-8">
          <div className="h-px w-full bg-amber/40" />
          <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber shadow-[0_0_16px_rgba(240,160,48,0.8)]" />
        </div>

        <p className="mb-2 font-[family-name:var(--font-bebas)] text-xs tracking-[0.2em] text-amber">
          CONFIRM BEFORE CONTINUING
        </p>

        <h2 className="font-[family-name:var(--font-dm-sans)] text-xl text-parchment md:text-2xl">
          {step.checkpointPrompt}
        </h2>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={onYes}
            className="text-amber hover:text-amber-bright transition-colors"
          >
            {step.checkpointYes}
          </button>
          <button
            onClick={onNo}
            className="text-muted hover:text-parchment/70 transition-colors"
          >
            {step.checkpointNo}
          </button>
        </div>

        <AnimatePresence>
          {showDiagnostic && step.checkpointDiagnostic && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 rounded border border-amber/20 bg-amber/5 p-4 text-sm leading-relaxed text-parchment/80"
            >
              {step.checkpointDiagnostic}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
