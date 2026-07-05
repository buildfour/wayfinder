"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FilmPerforations } from "@/components/layout/FilmPerforations";
import { StarChartGrid } from "@/components/layout/StarChart";
import { ConstellationProgress } from "@/components/layout/StarChart";
import { useCreationStore } from "@/store/creation-store";
import { PIPELINE_PHASES } from "@/lib/ingest/pipeline";
import type { ProcessingStage } from "@/lib/ingest/types";
import { motionDuration, reducedMotion } from "@/lib/motion/variants";
import { playFinaleChord } from "@/lib/sound/finale-chord";

function stageIndex(stage: ProcessingStage): number {
  if (stage === "complete") return PIPELINE_PHASES.length;
  if (stage === "error") return -1;
  return PIPELINE_PHASES.findIndex((p) => p.stage === stage);
}

export default function ProcessingPage() {
  const router = useRouter();
  const { runPipeline, sourceDocument, processingStage, ingestError } = useCreationStore();
  const [result, setResult] = useState<{
    stepCount: number;
    estimatedMinutes: number;
    method: string;
  } | null>(null);
  const [started, setStarted] = useState(false);
  const [finale, setFinale] = useState(false);
  const startTime = useRef(Date.now());

  const activePhase = stageIndex(processingStage);

  useEffect(() => {
    if (started) return;
    setStarted(true);

    runPipeline().then((tour) => {
      if (tour) {
        const method = useCreationStore.getState().extractionMethod ?? "heuristic";
        setResult({
          stepCount: tour.steps.filter((s) => !s.branchId).length,
          estimatedMinutes: tour.estimatedMinutes,
          method,
        });
        setFinale(true);
        if (!reducedMotion()) playFinaleChord();

        const elapsed = Date.now() - startTime.current;
        const minDisplay = motionDuration(4500);
        const wait = Math.max(0, minDisplay - elapsed);
        setTimeout(() => router.push("/new/preview"), wait + motionDuration(1200));
      }
    });
  }, [started, runPipeline, router]);

  const previewLines = sourceDocument?.text.split(/\n+/).filter((l) => l.trim().length > 15) ?? [];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-void film-grain">
      <StarChartGrid className="opacity-40" />

      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className="relative h-[70vh] w-[50vw] max-w-lg overflow-hidden border border-parchment/10">
          <div className="animate-scan-sweep absolute left-0 right-0 h-8 bg-gradient-to-b from-transparent via-amber/20 to-transparent" />
          {previewLines.slice(0, 20).map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, filter: "invert(1) blur(4px)" }}
              animate={{
                opacity: i <= activePhase * 4 ? 0.7 : 0.1,
                filter: i <= activePhase * 4 ? "invert(0) blur(0px)" : "invert(1) blur(4px)",
                backgroundColor: i <= activePhase * 4 ? "rgba(240,160,48,0.08)" : "transparent",
              }}
              transition={{ duration: motionDuration(0.6) }}
              className="mx-4 my-1.5 truncate text-[8px] text-parchment/40"
            >
              {line.slice(0, 80)}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 py-20">
        {PIPELINE_PHASES.map((phase, i) => (
          <motion.div
            key={phase.label}
            initial={{ opacity: 0, x: -16 }}
            animate={{
              opacity: i <= activePhase ? 1 : 0.2,
              x: 0,
              scale: i === activePhase ? 1.02 : 1,
            }}
            transition={{ duration: motionDuration(0.5), delay: i * 0.05 }}
            className="flex items-center gap-4"
          >
            <div
              className={`h-2 w-2 rounded-full ${
                i <= activePhase
                  ? "bg-teal shadow-[0_0_8px_rgba(0,212,180,0.6)]"
                  : "bg-parchment/20"
              }`}
            />
            <span
              className={`font-[family-name:var(--font-mono)] text-xs tracking-wider ${
                i <= activePhase ? "text-teal-bright" : "text-muted"
              }`}
            >
              {phase.label}
            </span>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: motionDuration(0.3) }}
        className="relative z-10 mt-8 font-[family-name:var(--font-source-serif)] text-lg italic text-parchment/60"
      >
        {sourceDocument
          ? `Reading "${sourceDocument.title}" so you don't have to.`
          : "Reading the whole thing so you don't have to."}
      </motion.p>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 mt-6 text-center"
          >
            <p className="font-[family-name:var(--font-mono)] text-sm text-amber">
              {result.stepCount} distilled steps · Est. {result.estimatedMinutes} min
              {result.method === "gemini" && " · AI agents"}
              {result.method === "heuristic" && " · Analyzed from source"}
              {result.method === "template" && " · Template path"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {finale && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 mt-10"
          >
            <ConstellationProgress
              total={Math.min(result.stepCount, 8)}
              current={Math.min(result.stepCount, 8) - 1}
              completed={Array.from({ length: Math.min(result.stepCount, 8) }, (_, i) => i)}
            />
            <p className="mt-4 font-[family-name:var(--font-bebas)] text-xs tracking-[0.25em] text-teal">
              PATH MATERIALIZED
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {ingestError && processingStage === "error" && (
        <p className="relative z-10 mt-4 text-sm text-amber-bright">{ingestError}</p>
      )}

      <FilmPerforations className="absolute bottom-0 left-0 right-0" />
    </div>
  );
}
