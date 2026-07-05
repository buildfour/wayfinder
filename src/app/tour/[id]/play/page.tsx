"use client";

import { use, useEffect } from "react";
import { TourPlayer } from "@/components/player/TourPlayer";
import { LoadingPulse } from "@/components/motion/LoadingPulse";
import { useLibraryStore } from "@/store/library-store";
import { useTourStore } from "@/store/tour-store";
import { seedDefaultTour } from "@/lib/tour-generator";

export default function PlayTourPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const hydrate = useLibraryStore((s) => s.hydrate);
  const getTour = useLibraryStore((s) => s.getTour);
  const loadTour = useTourStore((s) => s.loadTour);
  const initialized = useTourStore((s) => s.initialized);

  useEffect(() => {
    void (async () => {
      await hydrate();
      const tour = getTour(id) ?? seedDefaultTour();
      await loadTour(tour, true);
    })();
  }, [id, hydrate, getTour, loadTour]);

  if (!initialized) {
    return <LoadingPulse label="Loading tour…" />;
  }

  return <TourPlayer />;
}
