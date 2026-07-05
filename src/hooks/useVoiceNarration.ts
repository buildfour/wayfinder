"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useVoiceNarration(enabled: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    fetch("/api/voice/speak")
      .then((r) => r.json())
      .then((j) => setAvailable(!!j.configured))
      .catch(() => setAvailable(false));
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!enabled || !text.trim()) return;
      stop();

      try {
        const res = await fetch("/api/voice/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!res.ok) return;

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        setSpeaking(true);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setSpeaking(false);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          setSpeaking(false);
        };
        await audio.play();
      } catch {
        setSpeaking(false);
      }
    },
    [enabled, stop]
  );

  useEffect(() => () => stop(), [stop]);

  return { speak, stop, speaking, available };
}
