import Link from "next/link";
import { Wordmark } from "./Wordmark";

interface AppHeaderProps {
  showNewTour?: boolean;
  showCompass?: boolean;
  rightLabel?: string;
  rightHref?: string;
}

export function AppHeader({
  showNewTour = false,
  showCompass = false,
  rightLabel,
  rightHref,
}: AppHeaderProps) {
  return (
    <header className="relative z-20 flex items-center justify-between px-6 py-5 md:px-10">
      <Wordmark />
      <div className="flex items-center gap-6">
        {rightLabel && rightHref && (
          <Link
            href={rightHref}
            className="font-[family-name:var(--font-bebas)] text-xs tracking-[0.2em] text-amber flex items-center gap-2"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber shadow-[0_0_8px_rgba(240,160,48,0.8)]" />
            {rightLabel}
          </Link>
        )}
        {showNewTour && (
          <Link
            href="/new"
            className="flex items-center gap-2 font-[family-name:var(--font-bebas)] text-xs tracking-[0.15em] text-teal-bright"
          >
            <span className="h-2 w-2 rounded-full bg-teal animate-pulse-glow" />
            + NEW TOUR
          </Link>
        )}
        {showCompass && (
          <Link
            href="/settings"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-parchment/10 text-parchment/50 hover:border-teal/30 hover:text-teal transition-colors"
            aria-label="Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polygon points="12,6 14,12 12,18 10,12" fill="currentColor" stroke="none" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
            </svg>
          </Link>
        )}
      </div>
    </header>
  );
}
