"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";
import { FilmPerforations } from "@/components/layout/FilmPerforations";
import { useCreationStore } from "@/store/creation-store";

const suggestions = [
  "Set up for the first time",
  "Fix a broken config",
  "I already did part of it",
];

export default function GoalPage() {
  const router = useRouter();
  const { goal, setGoal, sourceDocument } = useCreationStore();

  const previewLines =
    sourceDocument?.text
      .split(/\n+/)
      .filter((l) => l.trim().length > 15)
      .slice(0, 14) ?? [];

  const displayLines =
    previewLines.length > 0
      ? previewLines
      : Array.from({ length: 12 }, () => "Source text loading…");

  const handleSubmit = () => {
    if (goal.trim()) router.push("/new/processing");
  };

  return (
    <div className="relative min-h-screen bg-void film-grain">
      <AppHeader showCompass />

      <main className="flex min-h-[calc(100vh-80px)]">
        {/* Film negative panel */}
        <div className="hidden w-[35%] border-r border-parchment/10 bg-charcoal/50 p-8 lg:block">
          <div className="relative h-full overflow-hidden rounded border border-parchment/10">
            <div className="absolute inset-0 bg-parchment/5 invert opacity-40 blur-[2px]" />
            <div className="relative p-6 space-y-2 overflow-hidden">
              {displayLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.2 }}
                  animate={{
                    opacity: goal.length > i * 3 ? 0.85 : 0.2,
                    backgroundColor:
                      goal.length > i * 3 ? "rgba(240,160,48,0.15)" : "rgba(232,228,220,0.1)",
                  }}
                  className="truncate text-[10px] text-parchment/50 px-1 py-0.5 rounded-sm"
                >
                  {line.slice(0, 72)}
                </motion.div>
              ))}
            </div>
            {goal.length > 5 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bottom-4 left-4 right-4 text-xs text-amber/70"
              >
                Developing relevant sections…
              </motion.div>
            )}
          </div>
        </div>

        {/* Goal input */}
        <div className="flex flex-1 flex-col justify-center px-6 py-12 md:px-16">
          <p className="mb-2 font-[family-name:var(--font-bebas)] text-xs tracking-[0.25em] text-teal">
            WHAT DO YOU NEED FROM THIS?
          </p>
          <p className="mb-12 max-w-lg text-sm text-muted leading-relaxed">
            Don&apos;t worry about the whole doc. Tell me what you&apos;re trying to
            accomplish — as specifically or loosely as you like.
          </p>

          <div className="relative mb-8">
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. I just need to get DKIM working for Google Workspace"
              rows={3}
              className="w-full resize-none bg-transparent font-[family-name:var(--font-source-serif)] text-2xl italic text-parchment placeholder:text-parchment/25 focus:outline-none md:text-3xl"
            />
            <span className="absolute bottom-0 left-0 h-6 w-0.5 bg-teal-bright cursor-blink" />
          </div>

          <div className="flex flex-wrap gap-3">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setGoal(s === suggestions[0] ? "I just need to get DKIM working for Google Workspace" : s)}
                className="rounded-full border border-cobalt/30 px-4 py-1.5 text-xs text-parchment/70 transition-colors hover:border-cobalt/60 hover:text-parchment"
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!goal.trim()}
            className={`mt-12 self-start text-sm transition-colors ${
              goal.trim() ? "text-teal-bright hover:text-teal" : "text-parchment/20"
            }`}
          >
            → Continue
          </button>
        </div>
      </main>

      <FilmPerforations className="absolute bottom-0 left-0 right-0" />
    </div>
  );
}
