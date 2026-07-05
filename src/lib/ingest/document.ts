import type { SourceDocument } from "./types";
import { buildExcerpt, countWords } from "./extract";

export function createSourceDocument(
  partial: Omit<SourceDocument, "id" | "excerpt" | "wordCount" | "ingestedAt"> & {
    excerpt?: string;
  }
): SourceDocument {
  const text = partial.text.trim();
  return {
    id: `doc-${Date.now()}`,
    excerpt: partial.excerpt ?? buildExcerpt(text),
    wordCount: countWords(text),
    ingestedAt: new Date().toISOString(),
    ...partial,
    text,
  };
}

export const KB_PROVIDERS = [
  {
    id: "notion",
    name: "Notion",
    description: "Import pages from your Notion workspace",
    oauthUrl: "/api/ingest/kb/notion",
    available: false,
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Connect docs and guides from Drive",
    oauthUrl: "/api/ingest/kb/google-drive",
    available: false,
  },
  {
    id: "confluence",
    name: "Confluence",
    description: "Pull runbooks and SOPs from Confluence",
    oauthUrl: "/api/ingest/kb/confluence",
    available: false,
  },
] as const;
