export type SourceType = "url" | "upload" | "kb";

export type IngestStatus = "idle" | "loading" | "success" | "error";

export type ProcessingStage =
  | "reading"
  | "prerequisites"
  | "branching"
  | "ordering"
  | "building"
  | "complete"
  | "error";

export interface SourceDocument {
  id: string;
  title: string;
  text: string;
  excerpt: string;
  wordCount: number;
  sourceType: SourceType;
  sourceUrl?: string;
  fileName?: string;
  mimeType?: string;
  kbProvider?: string;
  ingestedAt: string;
}

export interface IngestResult {
  success: boolean;
  document?: SourceDocument;
  error?: string;
}

export interface ProcessingPipelineResult {
  stage: ProcessingStage;
  tourId?: string;
  stepCount?: number;
  estimatedMinutes?: number;
  branchCount?: number;
  error?: string;
}

export interface KbProvider {
  id: string;
  name: string;
  description: string;
  oauthUrl: string;
  available: boolean;
}
