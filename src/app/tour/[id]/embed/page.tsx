"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchPublishedTour } from "@/lib/publish/client";
import { useLibraryStore } from "@/store/library-store";
import { ConstellationProgress } from "@/components/layout/StarChart";
import type { Tour } from "@/lib/types";
import { getResolvedStepCount } from "@/lib/tour-engine";

export default function EmbedTourPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const getTour = useLibraryStore((s) => s.getTour);
  const hydrate = useLibraryStore((s) => s.hydrate);
  const [tour, setTour] = useState<Tour | null>(null);

  useEffect(() => {
    void hydrate();
    fetchPublishedTour(id).then((res) => {
      setTour(res.success && res.tour ? res.tour : getTour(id) ?? null);
    });
  }, [id, hydrate, getTour]);

  if (!tour) {
    return (
      <div className="relative flex min-h-[480px] items-center justify-center bg-void film-grain text-sm text-muted">
        Tour not found
      </div>
    );
  }

  const stepCount = getResolvedStepCount(tour.steps, null);

  return (
    <div className="relative flex min-h-[640px] flex-col items-center justify-center overflow-hidden bg-void film-grain px-6 py-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10"
      >
        <ConstellationProgress
          total={Math.min(stepCount, 6)}
          current={0}
          completed={[]}
          className="mb-8 scale-90"
        />
        <p className="mb-4 font-[family-name:var(--font-bebas)] text-xs tracking-[0.3em] text-teal">
          WAYFINDER
        </p>
        <h1 className="max-w-md font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-parchment md:text-3xl">
          {tour.title.toUpperCase()}
        </h1>
        <p className="mt-3 font-[family-name:var(--font-mono)] text-[10px] text-amber">
          {stepCount} steps · ~{tour.estimatedMinutes} min
        </p>
        <Link
          href={`/tour/${tour.id}/play`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-block font-[family-name:var(--font-bebas)] text-xl tracking-wider text-amber text-glow-amber hover:text-amber-bright"
        >
          ▶ START TOUR
        </Link>
        <p className="mt-4 text-[10px] text-muted">Opens in full player</p>
      </motion.div>
    </div>
  );
}
