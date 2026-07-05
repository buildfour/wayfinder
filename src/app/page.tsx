"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Wordmark } from "@/components/layout/Wordmark";
import { FilmPerforations } from "@/components/layout/FilmPerforations";
import { StarChartGrid, ConstellationHero } from "@/components/layout/StarChart";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-void film-grain">
      <StarChartGrid />
      <Wordmark className="absolute left-6 top-6 z-20 md:left-10 md:top-8" />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-24">
        <ConstellationHero className="mb-12 opacity-90" />

        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="max-w-2xl text-center font-[family-name:var(--font-source-serif)] text-xl italic leading-relaxed text-parchment/90 md:text-2xl"
        >
          &ldquo;The doc knows everything. You only need your next step.&rdquo;
        </motion.blockquote>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 0.6 }}
          className="mt-10"
        >
          <Link
            href="/new"
            className="group relative font-[family-name:var(--font-dm-sans)] text-sm tracking-wide text-teal-bright transition-colors hover:text-teal"
          >
            <span className="relative z-10">→ Start a tour</span>
            <span className="absolute -inset-x-4 -inset-y-2 rounded bg-cobalt/10 opacity-0 blur-md transition-opacity group-hover:opacity-100" />
          </Link>
        </motion.div>
      </main>

      <FilmPerforations className="absolute bottom-0 left-0 right-0" />
    </div>
  );
}
