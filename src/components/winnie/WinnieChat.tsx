"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWinnieStore } from "@/store/winnie-store";
import { sendWinnieMessage } from "@/lib/winnie/chat-client";
import { useVoiceNarration } from "@/hooks/useVoiceNarration";

export function WinnieChat() {
  const pathname = usePathname();
  const {
    open,
    collapsed,
    messages,
    loading,
    voiceEnabled,
    toggleOpen,
    setCollapsed,
    setPageContext,
    setVoiceEnabled,
    addMessage,
    setLoading,
  } = useWinnieStore();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { speak, speaking, available: voiceAvailable } = useVoiceNarration(voiceEnabled);

  useEffect(() => {
    setPageContext(pathname);
  }, [pathname, setPageContext]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    addMessage({ role: "user", content: text });
    setLoading(true);

    const history = [...messages, { role: "user" as const, content: text }].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const res = await sendWinnieMessage(text, {
      pagePath: pathname,
      history,
    });

    setLoading(false);

    if (res.success && res.reply) {
      addMessage({ role: "assistant", content: res.reply });
      if (voiceEnabled) speak(res.reply);
    } else {
      addMessage({
        role: "assistant",
        content: res.error ?? "Sorry, I couldn't respond right now. Try again in a moment.",
      });
    }
  };

  if (collapsed && !open) {
    return (
      <button
        type="button"
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full border border-teal/40 bg-charcoal/90 text-xl shadow-lg backdrop-blur-md transition-transform hover:scale-105 hover:border-teal glow-teal"
        aria-label="Open Winnie assistant"
      >
        <span aria-hidden>✦</span>
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[100] flex w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-lg border border-teal/25 bg-charcoal/95 shadow-2xl backdrop-blur-md"
      >
        <header className="flex items-center justify-between border-b border-parchment/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-teal" aria-hidden>
              ✦
            </span>
            <span className="font-[family-name:var(--font-bebas)] text-sm tracking-widest text-teal">
              WINNIE
            </span>
            {speaking && (
              <span className="text-[10px] text-amber animate-pulse">speaking…</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {voiceAvailable && (
              <button
                type="button"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`text-[10px] tracking-wide ${voiceEnabled ? "text-teal" : "text-muted"}`}
                title="Toggle voice replies"
              >
                {voiceEnabled ? "🔊" : "🔇"}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setCollapsed(true);
                useWinnieStore.setState({ open: false });
              }}
              className="text-muted hover:text-parchment"
              aria-label="Minimize Winnie"
            >
              −
            </button>
          </div>
        </header>

        <div ref={scrollRef} className="flex max-h-72 flex-1 flex-col gap-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="text-xs leading-relaxed text-muted">
              Hi! I&apos;m Winnie. Ask me about creating tours, editing your storyboard, or what
              to do on this page.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded px-3 py-2 text-xs leading-relaxed ${
                m.role === "user"
                  ? "ml-6 bg-cobalt/20 text-parchment"
                  : "mr-4 border border-parchment/10 bg-void/50 text-parchment/90"
              }`}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <p className="text-xs text-muted animate-pulse">Winnie is thinking…</p>
          )}
        </div>

        <form
          className="flex gap-2 border-t border-parchment/10 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Winnie…"
            className="flex-1 rounded border border-parchment/10 bg-void/60 px-3 py-2 text-xs text-parchment placeholder:text-muted focus:border-teal/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded bg-teal/20 px-3 py-2 font-[family-name:var(--font-bebas)] text-xs tracking-wider text-teal disabled:opacity-40"
          >
            SEND
          </button>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
