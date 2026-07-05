import type { StepType } from "@/lib/types";

export interface ExtractedStepRaw {
  type: StepType;
  chapter?: string;
  headline: string;
  body: string;
  branchId?: string;
  branchOptions?: Array<{
    id: string;
    label: string;
    description: string;
  }>;
  checkpointPrompt?: string;
  sourcePassageText?: string;
  sourceHighlight?: string;
  previewTitle?: string;
  stuckMismatch?: string;
  stuckConfused?: string;
}

export interface ExtractTourResult {
  title: string;
  steps: ExtractedStepRaw[];
  estimatedMinutes: number;
  branchCount: number;
  method: "openai" | "heuristic" | "gemini";
}

export interface ExtractTourRequest {
  goal: string;
  sourceTitle: string;
  sourceText: string;
  sourceUrl?: string;
}
