import type { Transition, Variants } from "framer-motion";

export const easeCinematic = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1 },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

export const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
};

export const cinematicTransition: Transition = {
  duration: 0.7,
  ease: easeCinematic,
};

export function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function motionDuration(seconds: number): number {
  return reducedMotion() ? 0.01 : seconds;
}

export function grainClass(level: "heavy" | "medium" | "light" | "default" = "default"): string {
  switch (level) {
    case "heavy":
      return "film-grain film-grain-heavy";
    case "medium":
      return "film-grain film-grain-medium";
    case "light":
      return "film-grain film-grain-light";
    default:
      return "film-grain";
  }
}
