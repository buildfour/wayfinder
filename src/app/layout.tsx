import {
  Bebas_Neue,
  DM_Sans,
  JetBrains_Mono,
  Source_Serif_4,
} from "next/font/google";
import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { WinnieProvider } from "@/components/winnie/WinnieProvider";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  style: ["normal", "italic"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Wayfinder — The doc knows everything. You only need your next step.",
  description:
    "Turn any how-to article, SOP, or knowledge-base doc into a step-by-step guided tour.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bebas.variable} ${dmSans.variable} ${sourceSerif.variable} ${jetbrains.variable} h-full`}
    >
      <body className="min-h-full bg-void text-parchment antialiased">
        <AuthProvider>
          <WinnieProvider>{children}</WinnieProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
