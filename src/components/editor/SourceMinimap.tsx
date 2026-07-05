"use client";

import type { Tour, TourStep } from "@/lib/types";
import { getSourceAnchor } from "@/lib/tour-editor";

interface SourceMinimapProps {
  steps: TourStep[];
  selectedStepId: string | null;
  sourceTitle: string;
}

export function SourceMinimap({ steps, selectedStepId, sourceTitle }: SourceMinimapProps) {
  const anchors = steps
    .filter((s) => s.type !== "branch" || !s.branchId)
    .map((s) => ({
      id: s.id,
      anchor: getSourceAnchor(steps, s.id),
      isBranch: s.type === "branch",
    }));

  return (
    <div className="flex flex-col h-full">
      <h3 className="mb-4 font-[family-name:var(--font-bebas)] text-xs tracking-[0.2em] text-amber-bright">
        SOURCE DOCUMENT
      </h3>
      <p className="mb-8 text-sm text-parchment/70 line-clamp-2">{sourceTitle}</p>

      <div className="relative mx-auto flex-1 min-h-[200px] w-10">
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-parchment/10" />
        <div className="absolute inset-0 rounded-full bg-parchment/5" />

        {anchors.map(({ id, anchor, isBranch }) => {
          const selected = id === selectedStepId;
          return (
            <div
              key={id}
              className={`absolute left-1/2 -translate-x-1/2 transition-all duration-300 ${
                selected ? "z-10" : "z-0"
              }`}
              style={{ top: `${anchor * 100}%` }}
            >
              <div
                className={`rounded-full transition-all ${
                  selected
                    ? "h-4 w-4 bg-amber shadow-[0_0_12px_rgba(240,160,48,0.8)]"
                    : isBranch
                      ? "h-3 w-3 bg-teal/80"
                      : "h-2.5 w-2.5 bg-amber/50"
                }`}
              />
              {selected && (
                <div className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap">
                  <span className="font-[family-name:var(--font-mono)] text-[9px] text-amber">
                    STEP REGION
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-[10px] text-muted leading-relaxed">
        Glowing regions show which source sections each step draws from.
      </p>
    </div>
  );
}
