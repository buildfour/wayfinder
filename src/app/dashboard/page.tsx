"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { FilmPerforations } from "@/components/layout/FilmPerforations";
import { StarChartGrid } from "@/components/layout/StarChart";
import { Orrery } from "@/components/dashboard/Orrery";
import { LoadingPulse } from "@/components/motion/LoadingPulse";
import { useLibraryStore } from "@/store/library-store";

export default function DashboardPage() {
  const hydrate = useLibraryStore((s) => s.hydrate);
  const meta = useLibraryStore((s) => s.meta);
  const hydrated = useLibraryStore((s) => s.hydrated);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return <LoadingPulse label="Charting your tours…" />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-void film-grain">
      <StarChartGrid />
      <AppHeader showNewTour showCompass />

      <main className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-6">
        {meta.length === 0 ? (
          <div className="text-center">
            <MotionPlaceholder />
            <p className="font-[family-name:var(--font-source-serif)] text-lg italic text-parchment/70">
              No tours yet. Drop a doc and light the path.
            </p>
            <Link href="/new" className="mt-6 inline-block text-teal-bright">
              → New Tour
            </Link>
          </div>
        ) : (
          <Orrery tours={meta} />
        )}
      </main>

      <FilmPerforations className="absolute bottom-0 left-0 right-0" />
    </div>
  );
}

function MotionPlaceholder() {
  return (
    <div
      className="mx-auto mb-8 h-32 w-px animate-pulse-glow bg-gradient-to-b from-transparent via-teal/50 to-transparent"
      aria-hidden
    />
  );
}
