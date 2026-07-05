"use client";

import Link from "next/link";
import { useEffect } from "react";
import { StoryboardEditor } from "@/components/editor/StoryboardEditor";
import { useCreationStore } from "@/store/creation-store";

export default function PreviewPage() {
  const { generatedTour, goal, generateTour, setGeneratedTour } = useCreationStore();

  useEffect(() => {
    if (!generatedTour && goal) void generateTour();
  }, [generatedTour, goal, generateTour]);

  const tour = generatedTour;

  if (!tour) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-void gap-4">
        <p className="text-muted">No tour generated yet.</p>
        <Link href="/new" className="text-teal-bright">
          ← Start a new tour
        </Link>
      </div>
    );
  }

  return (
    <StoryboardEditor
      tour={tour}
      onTourChange={setGeneratedTour}
    />
  );
}
