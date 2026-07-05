import type { IngestResult } from "@/lib/ingest/types";
import type { SourceDocument } from "@/lib/ingest/types";

export async function ingestUrl(url: string): Promise<IngestResult> {
  const res = await fetch("/api/ingest/url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return res.json();
}

export async function ingestUpload(file: File): Promise<IngestResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/ingest/upload", { method: "POST", body: form });
  return res.json();
}

export async function connectKbProvider(providerId: string): Promise<{
  success: boolean;
  message?: string;
  oauthPlaceholder?: string;
}> {
  const res = await fetch(`/api/ingest/kb/${providerId}`);
  return res.json();
}

export function formatWordCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k words`;
  return `${n} words`;
}

export function documentPreviewLines(doc: SourceDocument, count = 6): string[] {
  return doc.text.split(/\n+/).filter((l) => l.trim().length > 20).slice(0, count);
}
