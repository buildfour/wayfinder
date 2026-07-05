"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WinnieMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface WinnieState {
  open: boolean;
  collapsed: boolean;
  messages: WinnieMessage[];
  loading: boolean;
  voiceEnabled: boolean;
  pageContext: string;
  setOpen: (open: boolean) => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleOpen: () => void;
  setPageContext: (ctx: string) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  addMessage: (msg: Omit<WinnieMessage, "id" | "timestamp">) => WinnieMessage;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const useWinnieStore = create<WinnieState>()(
  persist(
    (set, get) => ({
      open: false,
      collapsed: true,
      messages: [],
      loading: false,
      voiceEnabled: false,
      pageContext: "/",

      setOpen: (open) => set({ open, collapsed: !open }),
      setCollapsed: (collapsed) => set({ collapsed, open: !collapsed }),
      toggleOpen: () => set({ open: true, collapsed: false }),
      setPageContext: (pageContext) => set({ pageContext }),
      setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),
      addMessage: (msg) => {
        const full: WinnieMessage = {
          ...msg,
          id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
        };
        set({ messages: [...get().messages, full] });
        return full;
      },
      setLoading: (loading) => set({ loading }),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: "wayfinder-winnie",
      partialize: (s) => ({
        messages: s.messages.slice(-30),
        voiceEnabled: s.voiceEnabled,
      }),
    }
  )
);
