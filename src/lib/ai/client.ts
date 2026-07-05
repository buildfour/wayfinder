import type { SourceDocument } from "@/lib/ingest/types";
import type { Tour } from "@/lib/types";

export interface ExtractApiResponse {
  success: boolean;
  tour?: Tour;
  method?: "openai" | "heuristic" | "gemini";
  aiEnabled?: boolean;
  stepCount?: number;
  distilled?: boolean;
  agentTrace?: Array<{ agent: string; label: string; summary: string }>;
  error?: string;
}

export async function extractTourFromSource(
  goal: string,
  source: SourceDocument
): Promise<ExtractApiResponse> {
  const res = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal, source }),
  });
  return res.json();
}

export async function checkAIStatus(): Promise<{ aiEnabled: boolean }> {
  const res = await fetch("/api/extract");
  return res.json();
}
