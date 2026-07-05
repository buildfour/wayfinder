"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { Tour } from "@/lib/types";
import { buildEmbedSnippet, getTourEmbedUrl, getTourShareUrl } from "@/lib/publish/urls";
import { publishTour, syncPublishedTour } from "@/lib/publish/client";

type ShareTab = "url" | "embed" | "qr";

interface SharePanelProps {
  tour: Tour;
  onPublished?: (shareUrl: string) => void;
}

export function SharePanel({ tour, onPublished }: SharePanelProps) {
  const [tab, setTab] = useState<ShareTab>("url");
  const [shareUrl, setShareUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [embedSnippet, setEmbedSnippet] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(tour.lastSynced);
  const [publishError, setPublishError] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await publishTour(tour);
      const url =
        result.success && result.shareUrl
          ? result.shareUrl
          : getTourShareUrl(baseUrl, tour.id);

      if (cancelled) return;

      if (!result.success) setPublishError(result.error ?? "Failed to publish");
      else onPublished?.(url);

      setShareUrl(url);
      const embed = getTourEmbedUrl(baseUrl, tour.id);
      setEmbedUrl(embed);
      setEmbedSnippet(buildEmbedSnippet(embed, tour.title));

      const qr = await QRCode.toDataURL(url, {
        margin: 2,
        width: 200,
        color: { dark: "#00D4B4", light: "#04040A" },
      });
      if (!cancelled) setQrDataUrl(qr);
    })();

    return () => {
      cancelled = true;
    };
  }, [tour.id, tour.title, baseUrl, onPublished]);

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSync = async () => {
    setSyncing(true);
    const result = await syncPublishedTour(tour.id);
    if (result.success && result.tour?.lastSynced) {
      setLastSynced(result.tour.lastSynced);
    }
    setSyncing(false);
  };

  const tabs: { id: ShareTab; label: string }[] = [
    { id: "url", label: "COPY URL" },
    { id: "embed", label: "EMBED SNIPPET" },
    { id: "qr", label: "QR CODE" },
  ];

  return (
    <section className="border border-parchment/10 bg-charcoal/30 p-6">
      <div className="mb-4 flex gap-6 border-b border-parchment/10 pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`font-[family-name:var(--font-bebas)] text-[10px] tracking-wider transition-colors ${
              tab === t.id ? "text-teal-bright" : "text-muted hover:text-parchment/70"
            }`}
          >
            {copied === t.label ? "COPIED!" : t.label}
          </button>
        ))}
      </div>

      {publishError && (
        <p className="mb-3 text-xs text-amber-bright">{publishError}</p>
      )}

      {tab === "url" && (
        <div>
          <p className="font-[family-name:var(--font-mono)] text-xs text-parchment/60 break-all">
            {shareUrl || `…/tour/${tour.id}`}
          </p>
          <button
            type="button"
            onClick={() => copy(shareUrl, "COPY URL")}
            className="mt-4 text-xs text-teal-bright hover:text-teal"
          >
            → Copy link
          </button>
        </div>
      )}

      {tab === "embed" && (
        <div>
          <pre className="overflow-x-auto rounded border border-parchment/10 bg-void/50 p-3 font-[family-name:var(--font-mono)] text-[10px] text-parchment/70 leading-relaxed">
            {embedSnippet}
          </pre>
          <button
            type="button"
            onClick={() => copy(embedSnippet, "EMBED SNIPPET")}
            className="mt-4 text-xs text-teal-bright hover:text-teal"
          >
            → Copy embed code
          </button>
          <p className="mt-2 text-[10px] text-muted">
            Embeds the tour lobby at {embedUrl}
          </p>
        </div>
      )}

      {tab === "qr" && (
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {qrDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR code for tour" className="rounded border border-parchment/10" />
          )}
          <div>
            <p className="text-xs text-muted max-w-xs">
              Scan to open the published tour lobby on any device.
            </p>
            <button
              type="button"
              onClick={() => qrDataUrl && copy(shareUrl, "QR CODE")}
              className="mt-3 text-xs text-teal-bright hover:text-teal"
            >
              → Copy URL instead
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-parchment/10 pt-4">
        <p className="flex items-center gap-2 text-xs text-muted">
          <span className="h-2 w-2 rounded-full bg-teal animate-pulse-glow" />
          {lastSynced ? `Last synced with source: ${lastSynced}` : "Updates when source changes"}
        </p>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="font-[family-name:var(--font-bebas)] text-[10px] tracking-wider text-amber hover:text-amber-bright disabled:opacity-50"
        >
          {syncing ? "SYNCING…" : "↻ REFRESH SYNC"}
        </button>
      </div>
    </section>
  );
}
