import Link from "next/link";

interface WordmarkProps {
  className?: string;
  href?: string;
}

export function Wordmark({ className = "", href = "/" }: WordmarkProps) {
  return (
    <Link
      href={href}
      className={`font-[family-name:var(--font-bebas)] text-lg tracking-[0.35em] text-parchment/90 hover:text-parchment transition-colors ${className}`}
    >
      WAYFINDER
    </Link>
  );
}
