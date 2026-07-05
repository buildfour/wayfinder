"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Wordmark } from "@/components/layout/Wordmark";
import { FilmPerforations } from "@/components/layout/FilmPerforations";
import { StarChartGrid } from "@/components/layout/StarChart";
import { SharePanel } from "@/components/share/SharePanel";
import { useLibraryStore } from "@/store/library-store";
import { fetchPublishedTour } from "@/lib/publish/client";
import { getResolvedStepCount } from "@/lib/tour-engine";
import type { Tour } from "@/lib/types";

export default function PublishedTourPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const hydrate = useLibraryStore((s) => s.hydrate);
  const getTour = useLibraryStore((s) => s.getTour);
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void hydrate();
    fetchPublishedTour(id).then((res) => {
      if (res.success && res.tour) {
        setTour(res.tour);
      } else {
        setTour(getTour(id) ?? null);
      }
      setLoading(false);
    });
  }, [id, hydrate, getTour]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <p className="text-muted">Loading tour…</p>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-void">
        <p className="text-muted">Tour not found.</p>
        <p className="text-xs text-muted max-w-sm text-center">
          This link may only exist on the device that created it. Publish the tour from the builder first.
        </p>
        <Link href="/new" className="text-teal-bright text-sm">
          → Create a tour
        </Link>
      </div>
    );
  }

  const stepCount = getResolvedStepCount(tour.steps, null);

  return (
    <div className="relative min-h-screen bg-void film-grain">
      <StarChartGrid />
      <Wordmark className="absolute left-6 top-6 z-20 md:left-10" />

      <main className="relative z-10 flex min-h-screen flex-col px-6 py-20 md:flex-row md:items-center md:gap-16 md:px-16">
        <div className="flex-1 md:py-20">
          <h1 className="font-[family-name:var(--font-bebas)] text-4xl leading-tight tracking-wide text-parchment md:text-6xl">
            {tour.title.toUpperCase()}
          </h1>
          <p className="mt-4 text-sm text-muted">
            Derived from: {tour.sourceTitle} — condensed to {stepCount} steps
          </p>
          <p className="mt-2 font-[family-name:var(--font-mono)] text-xs text-amber">
            {stepCount} steps · ~{tour.estimatedMinutes} min
            {tour.branchCount > 0 ? ` · ${tour.branchCount} branches` : ""}
          </p>
          <p className="mt-6 text-[10px] text-muted">Created with Wayfinder</p>
        </div>

        <div className="flex flex-col items-center justify-center py-12 md:py-0">
          <Link href={`/tour/${tour.id}/play`} className="group text-center">
            <span className="font-[family-name:var(--font-bebas)] text-3xl tracking-wider text-amber text-glow-amber transition-colors group-hover:text-amber-bright md:text-4xl">
              ▶ START TOUR
            </span>
            <p className="mt-3 text-xs text-muted">NO ACCOUNT REQUIRED</p>
          </Link>
        </div>
      </main>

      <div className="relative z-10 mx-6 mb-20 max-w-2xl md:mx-16">
        <SharePanel tour={tour} />
      </div>

      <FilmPerforations className="absolute bottom-0 left-0 right-0" />
    </div>
  );
}
