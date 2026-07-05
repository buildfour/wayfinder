let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioContext = new Ctx();
  }
  return audioContext;
}

/** Three-note ascending finale chord (C5 → E5 → G5) */
export function playFinaleChord(): void {
  const ctx = getContext();
  if (!ctx) return;

  void ctx.resume();

  const notes = [523.25, 659.25, 783.99];
  const now = ctx.currentTime;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now + i * 0.12);
    gain.gain.linearRampToValueAtTime(0.08, now + i * 0.12 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 1.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 1.5);
  });
}
