"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { SavedTourMeta } from "@/lib/types";
import { reducedMotion } from "@/lib/motion/variants";

interface OrreryProps {
  tours: SavedTourMeta[];
}

interface OrbitNode {
  tour: SavedTourMeta;
  baseAngle: number;
  radius: number;
  driftSpeed: number;
}

function recencyScore(updatedAt: string): number {
  const ageMs = Date.now() - new Date(updatedAt).getTime();
  const dayMs = 86_400_000;
  return Math.max(0, 1 - ageMs / (dayMs * 14));
}

function buildNodes(tours: SavedTourMeta[]): OrbitNode[] {
  const sorted = [...tours].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return sorted.map((tour, i) => {
    const recency = recencyScore(tour.updatedAt);
    const baseAngle = (i / Math.max(tours.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const radius = 120 + (1 - tour.progress) * 50 - recency * 18;
    const driftSpeed = 0.00015 + recency * 0.00035 + i * 0.00003;
    return { tour, baseAngle, radius, driftSpeed };
  });
}

export function Orrery({ tours }: OrreryProps) {
  const [time, setTime] = useState(0);
  const [entered, setEntered] = useState(false);
  const nodes = useMemo(() => buildNodes(tours), [tours]);
  const activeTour = nodes[0]?.tour;

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (reducedMotion()) return;
    let frame: number;
    const tick = (t: number) => {
      setTime(t);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="relative h-[500px] w-full max-w-3xl">
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative animate-pulse-glow">
          <div className="h-24 w-24 rounded-full border border-teal/30 bg-teal/20 shadow-[0_0_40px_rgba(0,212,180,0.4)]" />
          <span className="absolute -bottom-8 left-1/2 max-w-[120px] -translate-x-1/2 truncate whitespace-nowrap text-center font-[family-name:var(--font-bebas)] text-xs tracking-wider text-teal">
            {activeTour ? activeTour.title.split(" ")[0].slice(0, 8) : "ACTIVE"}
          </span>
        </div>
      </motion.div>

      {nodes.map(({ tour, baseAngle, radius, driftSpeed }, i) => {
        const angle = baseAngle + time * driftSpeed;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <motion.div
            key={tour.id}
            className="absolute left-1/2 top-1/2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: entered ? 1 : 0, scale: entered ? 1 : 0 }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 200 }}
            style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
          >
            <Link href={`/tour/${tour.id}/play`} className="group block">
              <div className="relative transition-transform group-hover:scale-110">
                <svg className="absolute -inset-4 h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(0,212,180,0.2)" strokeWidth="1" />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="#00D4B4"
                    strokeWidth="1.5"
                    strokeDasharray={`${tour.progress * 226} 226`}
                  />
                </svg>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-parchment/10 bg-charcoal transition-all group-hover:border-teal/40 group-hover:shadow-[0_0_20px_rgba(0,212,180,0.3)]">
                  <span className="font-[family-name:var(--font-bebas)] text-[10px] tracking-wider text-parchment/80">
                    {tour.title.split(" ")[0].slice(0, 5)}
                  </span>
                </div>
                <div className="pointer-events-none absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="rounded border border-parchment/10 bg-charcoal/90 px-3 py-2 text-center backdrop-blur-sm">
                    <p className="font-[family-name:var(--font-bebas)] text-xs tracking-wider">{tour.title}</p>
                    <p className="mt-1 text-[10px] text-muted">
                      {tour.stepCount} steps · last at step {tour.lastVisitedStep}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}

      <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 animate-orbit-slow rounded-full border border-parchment/5" />
      <div className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 animate-orbit-reverse rounded-full border border-parchment/5" />
    </div>
  );
}
