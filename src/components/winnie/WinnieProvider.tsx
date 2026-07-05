"use client";

import { WinnieChat } from "./WinnieChat";

export function WinnieProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <WinnieChat />
    </>
  );
}
