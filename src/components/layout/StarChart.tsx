"use client";

import { motion } from "framer-motion";

export function StarChartGrid({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 star-grid opacity-60 ${className}`} aria-hidden>
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <radialGradient id="spotlight" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="rgba(26,95,212,0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#spotlight)" />
      </svg>
    </div>
  );
}

interface ConstellationProgressProps {
  total: number;
  current: number;
  completed: number[];
  className?: string;
}

export function ConstellationProgress({
  total,
  current,
  completed,
  className = "",
}: ConstellationProgressProps) {
  const nodes = Array.from({ length: total }, (_, i) => i);

  return (
    <div className={`flex items-center justify-center gap-0 ${className}`}>
      {nodes.map((i) => {
        const isComplete = completed.includes(i);
        const isCurrent = i === current;
        const isFuture = i > current && !isComplete;

        return (
          <div key={i} className="flex items-center">
            {i > 0 && (
              <div
                className={`h-px w-8 sm:w-12 md:w-16 transition-all duration-500 ${
                  isComplete || isCurrent
                    ? "bg-teal/60 shadow-[0_0_8px_rgba(0,212,180,0.5)]"
                    : "bg-parchment/10"
                }`}
              />
            )}
            <motion.div
              className={`relative rounded-full ${
                isCurrent
                  ? "h-3 w-3 bg-amber shadow-[0_0_16px_rgba(240,160,48,0.8)]"
                  : isComplete
                    ? "h-2 w-2 bg-teal shadow-[0_0_8px_rgba(0,212,180,0.6)]"
                    : "h-1.5 w-1.5 bg-parchment/20"
              }`}
              animate={isCurrent ? { scale: [1, 1.3, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              {isCurrent && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-amber/30"
                  animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

interface ConstellationHeroProps {
  className?: string;
}

export function ConstellationHero({ className = "" }: ConstellationHeroProps) {
  const points = [
    { x: 80, y: 280 },
    { x: 200, y: 220 },
    { x: 340, y: 200 },
    { x: 480, y: 180 },
    { x: 620, y: 160 },
    { x: 760, y: 140 },
    { x: 900, y: 120 },
  ];

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg
      viewBox="0 0 980 400"
      className={`w-full max-w-4xl mx-auto ${className}`}
      aria-hidden
    >
      <motion.path
        d={pathD}
        fill="none"
        stroke="rgba(0,212,180,0.3)"
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3, ease: "easeInOut" }}
      />
      {points.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 8 : 4}
          fill={i === points.length - 1 ? "#F0A030" : "#00D4B4"}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: i === points.length - 1 ? 1 : 0.7, scale: 1 }}
          transition={{ delay: 0.3 + i * 0.3, duration: 0.5 }}
          style={{
            filter:
              i === points.length - 1
                ? "drop-shadow(0 0 12px rgba(240,160,48,0.8))"
                : "drop-shadow(0 0 6px rgba(0,212,180,0.5))",
          }}
        />
      ))}
      {points.length > 0 && (
        <text
          x={points[points.length - 1].x}
          y={points[points.length - 1].y - 20}
          textAnchor="middle"
          className="fill-amber text-[10px] tracking-widest"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          DESTINATION
        </text>
      )}
    </svg>
  );
}
