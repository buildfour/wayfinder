export function LoadingPulse({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-void">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border border-teal/20 animate-orbit-slow" />
        <div className="absolute inset-2 rounded-full border border-amber/30 animate-orbit-reverse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-3 w-3 rounded-full bg-teal shadow-[0_0_12px_rgba(0,212,180,0.8)] animate-pulse-glow" />
        </div>
      </div>
      <p className="font-[family-name:var(--font-mono)] text-xs tracking-widest text-muted">{label}</p>
    </div>
  );
}
