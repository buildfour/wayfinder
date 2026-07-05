"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Wordmark } from "@/components/layout/Wordmark";
import { FilmPerforations } from "@/components/layout/FilmPerforations";
import { StarChartGrid, ConstellationProgress } from "@/components/layout/StarChart";
import { grainClass } from "@/lib/motion/variants";

const acts = [
  {
    id: "act-1",
    label: "ACT I",
    title: "Your resource. Dense, complete, not for you.",
    visual: "doc" as const,
    grain: "heavy" as const,
  },
  {
    id: "act-2",
    label: "ACT II",
    title: "I just need to connect my domain.",
    response: "Materializing solution steps...",
    visual: "goal" as const,
    grain: "medium" as const,
  },
  {
    id: "act-3",
    label: "ACT III",
    title: "Follow the light.",
    visual: "path" as const,
    grain: "light" as const,
  },
];

export default function HowItWorksPage() {
  return (
    <div className={`relative min-h-screen ${grainClass("default")}`}>
      <StarChartGrid />
      <div className="relative z-10 px-6 py-8 md:px-10">
        <Wordmark />
      </div>

      <div className="relative z-10 flex flex-col">
        {acts.map((act) => (
          <motion.section
            key={act.id}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className={`relative flex min-h-screen flex-col items-center justify-center px-6 py-20 ${grainClass(act.grain)}`}
          >
            <span className="mb-8 font-[family-name:var(--font-bebas)] text-sm tracking-[0.3em] text-amber">
              {act.label}
            </span>

            {act.visual === "doc" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="relative mb-10 h-48 w-64 border border-parchment/10 bg-charcoal/50 shadow-[0_0_60px_rgba(240,160,48,0.15)]"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-amber/10 to-transparent" />
                <div className="space-y-2 p-6 opacity-30">
                  {[85, 70, 92, 65, 78, 88, 72, 95].map((w, i) => (
                    <div key={i} className="h-1 bg-parchment/40" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </motion.div>
            )}

            {act.visual === "goal" && (
              <div className="mb-10 max-w-lg text-center">
                <p className="font-[family-name:var(--font-source-serif)] text-2xl italic text-parchment/90 md:text-3xl">
                  &ldquo;{act.title}&rdquo;
                </p>
                {act.response && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 font-[family-name:var(--font-dm-sans)] text-teal-bright"
                  >
                    {act.response}
                  </motion.p>
                )}
              </div>
            )}

            {act.visual === "path" && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="mb-10"
              >
                <ConstellationProgress
                  total={5}
                  current={2}
                  completed={[0, 1]}
                  className="scale-125"
                />
              </motion.div>
            )}

            {act.visual !== "goal" && (
              <p className="max-w-md text-center font-[family-name:var(--font-source-serif)] text-lg italic text-parchment/70">
                {act.title}
              </p>
            )}
          </motion.section>
        ))}
      </div>

      <div className="relative z-10 flex justify-center pb-12">
        <Link href="/new" className="text-sm text-teal-bright hover:text-teal">
          → Start a tour
        </Link>
      </div>

      <FilmPerforations />
    </div>
  );
}
