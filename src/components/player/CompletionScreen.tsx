"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ConstellationProgress, StarChartGrid } from "@/components/layout/StarChart";
import { FilmPerforations } from "@/components/layout/FilmPerforations";
import { playFinaleChord } from "@/lib/sound/finale-chord";
import { motionDuration, reducedMotion } from "@/lib/motion/variants";
import type { Tour } from "@/lib/types";

interface CompletionScreenProps {
  tour: Tour;
  totalSteps: number;
  completedIndices: number[];
  elapsedMinutes: number;
  onReplay: () => void;
}

export function CompletionScreen({
  tour,
  totalSteps,
  completedIndices,
  elapsedMinutes,
  onReplay,
}: CompletionScreenProps) {
  const [shared, setShared] = useState(false);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    const d = motionDuration;
    const timers = [
      setTimeout(() => setBeat(1), d(400)),
      setTimeout(() => setBeat(2), d(1200)),
      setTimeout(() => setBeat(3), d(2000)),
      setTimeout(() => {
        setBeat(4);
        if (!reducedMotion()) playFinaleChord();
      }, d(2600)),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleShare = async () => {
    const { publishTour } = await import("@/lib/publish/client");
    const result = await publishTour(tour);
    if (result.shareUrl) {
      await navigator.clipboard.writeText(result.shareUrl);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
    window.open(`/tour/${tour.id}`, "_blank");
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-void film-grain">
      <StarChartGrid />

      {beat >= 2 && (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber/10 blur-3xl"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1.2 }}
          transition={{ duration: motionDuration(1.2) }}
          aria-hidden
        />
      )}

      <div className="relative z-10 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: beat >= 1 ? 1 : 0, scale: beat >= 1 ? 1 : 0.85 }}
          transition={{ duration: motionDuration(0.8), ease: [0.22, 1, 0.36, 1] }}
        >
          <ConstellationProgress
            total={totalSteps}
            current={totalSteps - 1}
            completed={completedIndices}
            className="mb-12"
          />
        </motion.div>

        <motion.h1
          className="font-[family-name:var(--font-bebas)] text-3xl tracking-[0.15em] text-parchment text-glow-amber md:text-5xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: beat >= 2 ? 1 : 0, y: beat >= 2 ? 0 : 20 }}
          transition={{ duration: motionDuration(0.7) }}
        >
          {tour.title.toUpperCase()} COMPLETE
        </motion.h1>

        <motion.p
          className="mt-4 font-[family-name:var(--font-mono)] text-xs text-amber"
          initial={{ opacity: 0 }}
          animate={{ opacity: beat >= 3 ? 1 : 0 }}
          transition={{ duration: motionDuration(0.5) }}
        >
          COMPLETED IN {elapsedMinutes} MIN · {totalSteps} STEPS · {tour.sourceTitle.toUpperCase()}
        </motion.p>

        <motion.p
          className="mt-6 font-[family-name:var(--font-source-serif)] text-lg italic text-parchment/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: beat >= 3 ? 1 : 0 }}
          transition={{ duration: motionDuration(0.5), delay: motionDuration(0.15) }}
        >
          You followed every step. The doc did the rest.
        </motion.p>

        <motion.div
          className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: beat >= 4 ? 1 : 0, y: beat >= 4 ? 0 : 16 }}
          transition={{ duration: motionDuration(0.6) }}
        >
          <button
            type="button"
            onClick={onReplay}
            className="font-[family-name:var(--font-bebas)] text-xs tracking-[0.2em] text-muted hover:text-parchment"
          >
            ↻ REPLAY TOUR
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="border border-cobalt-bright px-6 py-2 font-[family-name:var(--font-bebas)] text-xs tracking-[0.2em] text-parchment hover:bg-cobalt/20"
          >
            {shared ? "⤴ LINK COPIED" : "⤴ SHARE THIS TOUR"}
          </button>
          <Link
            href="/dashboard"
            className="font-[family-name:var(--font-bebas)] text-xs tracking-[0.2em] text-muted hover:text-parchment"
          >
            ← BACK TO TOURS
          </Link>
        </motion.div>
      </div>

      <FilmPerforations className="absolute bottom-0 left-0 right-0" />
    </div>
  );
}
