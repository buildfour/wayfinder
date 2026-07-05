import type { ExtractedStepRaw } from "../types";

export type AgentName =
  | "orchestrator"
  | "reader"
  | "distiller"
  | "ordering"
  | "quality"
  | "pedagogy"
  | "fidelity"
  | "reorder";

export interface AgentTraceEntry {
  agent: AgentName;
  label: string;
  summary: string;
}

export interface ReaderBrief {
  goalSummary: string;
  relevantThemes: string[];
  prerequisites: string[];
  branchHints: string[];
  jargonToSimplify: string[];
}

export interface DistillerOutput {
  distilledPrinciples: string[];
  steps: ExtractedStepRaw[];
}

export interface OrderingOutput {
  title: string;
  estimatedMinutes: number;
  branchCount: number;
  steps: ExtractedStepRaw[];
  orderingRationale: string;
}

export interface ReorderSuggestion {
  id: string;
  label: string;
  rationale: string;
  stepIds: string[];
}

export interface ReorderIssue {
  severity: "warning" | "info";
  message: string;
  recommendation: string;
  affectedStepIds?: string[];
}

export interface ReorderAdvice {
  suggestions: ReorderSuggestion[];
  issues: ReorderIssue[];
  method: "gemini" | "heuristic";
}
