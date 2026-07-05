"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/layout/AppHeader";
import { FilmPerforations } from "@/components/layout/FilmPerforations";
import { useCreationStore } from "@/store/creation-store";
import { KB_PROVIDERS } from "@/lib/ingest/document";
import { documentPreviewLines, formatWordCount } from "@/lib/ingest/client";

type Tab = "url" | "upload" | "connect";

export default function NewTourPage() {
  const router = useRouter();
  const {
    resourceUrl,
    sourceDocument,
    ingestStatus,
    ingestError,
    setResourceUrl,
    ingestFromUrl,
    ingestFromFile,
    connectKb,
  } = useCreationStore();

  const [tab, setTab] = useState<Tab>("url");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resourceReady = ingestStatus === "success" && !!sourceDocument;

  const handleUrlChange = (url: string) => {
    setResourceUrl(url);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (url.length < 12) return;

    debounceRef.current = setTimeout(() => {
      ingestFromUrl(url);
    }, 800);
  };

  const handleFile = useCallback(
    async (file: File) => {
      const ok = await ingestFromFile(file);
      if (ok) setTab("upload");
    },
    [ingestFromFile]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "url", label: "URL" },
    { id: "upload", label: "UPLOAD" },
    { id: "connect", label: "CONNECT KB" },
  ];

  return (
    <div className="relative min-h-screen bg-void film-grain">
      <AppHeader showCompass />

      <main className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <h1 className="mb-8 text-center font-[family-name:var(--font-bebas)] text-sm tracking-[0.3em] text-teal">
            LOAD YOUR RESOURCE
          </h1>

          <div className="rounded border border-cobalt/20 bg-charcoal/30 p-8 glow-cobalt backdrop-blur-sm">
            <div className="mb-8 flex gap-6 border-b border-parchment/10 pb-4">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`font-[family-name:var(--font-bebas)] text-xs tracking-[0.2em] transition-colors ${
                    tab === t.id ? "text-teal-bright" : "text-muted hover:text-parchment/70"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "url" && (
              <input
                type="url"
                value={resourceUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Paste the how-to, guide, SOP, or article URL"
                className="w-full bg-transparent font-[family-name:var(--font-source-serif)] text-lg text-parchment placeholder:text-parchment/30 focus:outline-none"
              />
            )}

            {tab === "upload" && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex h-36 cursor-pointer flex-col items-center justify-center border border-dashed rounded transition-colors ${
                  dragOver
                    ? "border-teal/50 bg-teal/5"
                    : "border-parchment/15 hover:border-parchment/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.md,.markdown,.txt,text/plain,text/markdown,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                <svg className="mb-2 h-8 w-8 text-parchment/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="12,6 14,12 12,18 10,12" fill="currentColor" stroke="none" />
                </svg>
                <p className="text-sm text-muted">Drop PDF, DOCX, Markdown, or TXT</p>
              </div>
            )}

            {tab === "connect" && (
              <div className="space-y-3 py-2">
                {KB_PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => connectKb(provider.id)}
                    className="flex w-full items-center justify-between border border-parchment/10 px-4 py-3 text-left transition-colors hover:border-cobalt/30"
                  >
                    <div>
                      <p className="text-sm text-parchment">{provider.name}</p>
                      <p className="text-xs text-muted">{provider.description}</p>
                    </div>
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-muted">
                      OAuth
                    </span>
                  </button>
                ))}
              </div>
            )}

            {ingestStatus === "loading" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 flex items-center gap-3 border-t border-parchment/10 pt-6"
              >
                <span className="h-2 w-2 rounded-full bg-teal animate-pulse-glow" />
                <span className="text-sm text-teal-bright">Reading document metadata…</span>
              </motion.div>
            )}

            {ingestError && (
              <p className="mt-6 text-sm text-amber-bright">{ingestError}</p>
            )}

            {sourceDocument && ingestStatus === "success" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-8 border-t border-parchment/10 pt-6"
              >
                <div className="flex gap-4">
                  <div className="h-20 w-14 shrink-0 overflow-hidden border border-parchment/10 bg-parchment/5 p-2 invert opacity-60">
                    {documentPreviewLines(sourceDocument, 4).map((line, i) => (
                      <div key={i} className="mb-1 h-1 bg-parchment/60" style={{ width: `${60 + (i % 3) * 15}%` }} />
                    ))}
                  </div>
                  <div>
                    <p className="font-[family-name:var(--font-source-serif)] text-sm text-parchment line-clamp-1">
                      {sourceDocument.title}
                    </p>
                    <p className="mt-1 text-xs text-muted line-clamp-2">{sourceDocument.excerpt}</p>
                    <p className="mt-2 font-[family-name:var(--font-mono)] text-[10px] text-teal">
                      {formatWordCount(sourceDocument.wordCount)} · {sourceDocument.sourceType}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => resourceReady && router.push("/new/goal")}
              disabled={!resourceReady}
              className={`font-[family-name:var(--font-dm-sans)] text-sm transition-colors ${
                resourceReady
                  ? "text-teal-bright hover:text-teal cursor-pointer"
                  : "text-parchment/20 cursor-not-allowed"
              }`}
            >
              → Tell me your goal
            </button>
          </div>
        </motion.div>
      </main>

      <FilmPerforations className="absolute bottom-0 left-0 right-0" />
    </div>
  );
}
