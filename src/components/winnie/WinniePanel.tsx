"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Tour, TourStep } from "@/lib/types";
import type { ReorderAdvice, ReorderIssue, ReorderSuggestion } from "@/lib/ai/agents/types";
import { fetchReorderAdvice } from "@/lib/winnie/client";
import { validateStepOrder } from "@/lib/tour-editor";

interface WinniePanelProps {
  goal: string;
  steps: TourStep[];
  collapsed?: boolean;
  onApplyOrder: (stepIds: string[]) => void;
  onReorderFeedback?: (issues: ReorderIssue[]) => void;
}

export function WinniePanel({
  goal,
  steps,
  collapsed: defaultCollapsed = false,
  onApplyOrder,
  onReorderFeedback,
}: WinniePanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [loading, setLoading] = useState(true);
  const [advice, setAdvice] = useState<ReorderAdvice | null>(null);
  const [localIssues, setLocalIssues] = useState<ReorderIssue[]>([]);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const loadAdvice = useCallback(async () => {
    setLoading(true);
    const result = await fetchReorderAdvice(goal, steps);
    setAdvice(result);
    setLoading(false);
  }, [goal, steps]);

  useEffect(() => {
    loadAdvice();
  }, [loadAdvice]);

  useEffect(() => {
    const issues = validateStepOrder(steps);
    setLocalIssues(issues);
    onReorderFeedback?.(issues);
  }, [steps, onReorderFeedback]);

  const allIssues = mergeIssues(localIssues, advice?.issues ?? []);
  const suggestions = advice?.suggestions ?? [];
  const currentOrderKey = steps.map((s) => s.id).join(",");

  const handleApply = (suggestion: ReorderSuggestion) => {
    if (suggestion.stepIds.join(",") === currentOrderKey) return;
    onApplyOrder(suggestion.stepIds);
    setAppliedId(suggestion.id);
    setTimeout(() => setAppliedId(null), 2000);
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="flex w-full items-center gap-2 rounded border border-teal/30 bg-teal/5 px-3 py-2 text-left transition-colors hover:border-teal/50"
        aria-label="Open Winnie assistant"
      >
        <span className="text-lg" aria-hidden>
          ✦
        </span>
        <span className="font-[family-name:var(--font-bebas)] text-xs tracking-widest text-teal">
          WINNIE
        </span>
        {allIssues.length > 0 && (
          <span className="ml-auto rounded-full bg-amber/20 px-2 py-0.5 text-[10px] text-amber">
            {allIssues.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="flex flex-col rounded border border-teal/20 bg-charcoal/40 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-parchment/10 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-teal" aria-hidden>
            ✦
          </span>
          <span className="font-[family-name:var(--font-bebas)] text-xs tracking-widest text-teal">
            WINNIE
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="text-[10px] text-muted hover:text-parchment"
          aria-label="Collapse Winnie"
        >
          −
        </button>
      </div>

      <div className="max-h-[50vh] overflow-y-auto p-3 space-y-4">
        <p className="text-[11px] leading-relaxed text-muted">
          I can suggest step orders — you always decide what ships.
        </p>

        <section>
          <h3 className="mb-2 font-[family-name:var(--font-bebas)] text-[10px] tracking-widest text-amber">
            SUGGESTED ORDERS
          </h3>
          {loading ? (
            <p className="text-[11px] text-muted animate-pulse">Thinking through your storyboard…</p>
          ) : (
            <ul className="space-y-2">
              {suggestions.map((s) => {
                const isCurrent = s.stepIds.join(",") === currentOrderKey;
                return (
                  <li
                    key={s.id}
                    className="rounded border border-parchment/10 bg-void/40 p-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-parchment">{s.label}</p>
                        <p className="mt-1 text-[10px] leading-snug text-muted">{s.rationale}</p>
                      </div>
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleApply(s)}
                          className="shrink-0 rounded border border-teal/40 px-2 py-1 text-[10px] text-teal hover:bg-teal/10"
                        >
                          {appliedId === s.id ? "Applied" : "Apply"}
                        </button>
                      )}
                      {isCurrent && (
                        <span className="shrink-0 text-[10px] text-teal/70">Current</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <AnimatePresence>
          {allIssues.length > 0 && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h3 className="mb-2 font-[family-name:var(--font-bebas)] text-[10px] tracking-widest text-amber-bright">
                ORDER NOTES
              </h3>
              <ul className="space-y-2">
                {allIssues.map((issue, i) => (
                  <li
                    key={`${issue.message}-${i}`}
                    className={`rounded border p-2 text-[10px] leading-snug ${
                      issue.severity === "warning"
                        ? "border-amber/30 bg-amber/5 text-parchment"
                        : "border-parchment/10 bg-void/30 text-muted"
                    }`}
                  >
                    <p className="font-medium">{issue.message}</p>
                    <p className="mt-1 text-parchment/70">{issue.recommendation}</p>
                    <p className="mt-1 italic text-muted/80">Your call — keep or adjust.</p>
                  </li>
                ))}
              </ul>
            </motion.section>
          )}
        </AnimatePresence>

        {!loading && allIssues.length === 0 && suggestions.length > 0 && (
          <p className="text-[10px] text-teal/80">No order issues flagged. Looks good to me.</p>
        )}
      </div>
    </div>
  );
}

function mergeIssues(a: ReorderIssue[], b: ReorderIssue[]): ReorderIssue[] {
  const seen = new Set<string>();
  return [...a, ...b].filter((issue) => {
    if (seen.has(issue.message)) return false;
    seen.add(issue.message);
    return true;
  });
}
