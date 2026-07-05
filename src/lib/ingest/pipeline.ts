import type { ProcessingStage, SourceDocument } from "@/lib/ingest/types";
import {
  detectBranchesInText,
  detectPrerequisitesInText,
} from "@/lib/ingest/source-text";
import { generateTourFromGoal } from "@/lib/tour-generator";
import { extractTourFromSource } from "@/lib/ai/client";
import type { Tour } from "@/lib/types";

export interface PipelinePhase {
  stage: ProcessingStage;
  label: string;
}

export const PIPELINE_PHASES: PipelinePhase[] = [
  { stage: "reading", label: "READER AGENT — SCANNING SOURCE…" },
  { stage: "prerequisites", label: "DISTILLER — PLAIN-LANGUAGE STEPS…" },
  { stage: "branching", label: "ORDERING AGENT — SEQUENCING PATH…" },
  { stage: "ordering", label: "QUALITY OPS — CLARITY PASS…" },
  { stage: "building", label: "PEDAGOGY + FIDELITY OPS — FINALIZING…" },
];

export interface PipelineResult {
  tour: Tour;
  stepCount: number;
  estimatedMinutes: number;
  branchCount: number;
  hasPrerequisites: boolean;
  extractionMethod: "openai" | "heuristic" | "template" | "gemini";
  distilled: boolean;
  agentTrace?: Array<{ agent: string; label: string; summary: string }>;
}

export async function runProcessingPipeline(
  goal: string,
  source: SourceDocument | null,
  onStage: (stage: ProcessingStage, index: number) => void
): Promise<PipelineResult> {
  const text = source?.text ?? "";

  onStage("reading", 0);
  await delay(300);

  onStage("prerequisites", 1);
  const hasPrerequisites = text ? detectPrerequisitesInText(text) : true;
  await delay(400);

  onStage("branching", 2);
  const hasBranches = text ? detectBranchesInText(text) : false;
  await delay(400);

  onStage("ordering", 3);
  await delay(400);

  onStage("building", 4);

  let tour: Tour;
  let extractionMethod: PipelineResult["extractionMethod"] = "template";

  if (source?.text && source.text.length >= 30) {
    const result = await extractTourFromSource(goal, source);
    if (result.success && result.tour) {
      tour = result.tour;
      extractionMethod = result.method ?? "heuristic";
      await delay(200);
      onStage("complete", 5);
      return {
        tour,
        stepCount: tour.steps.filter((s) => !s.branchId).length,
        estimatedMinutes: tour.estimatedMinutes,
        branchCount: tour.branchCount,
        hasPrerequisites: hasPrerequisites || hasBranches,
        extractionMethod,
        distilled: result.distilled ?? true,
        agentTrace: result.agentTrace,
      };
    } else {
      tour = generateTourFromGoal(goal, source.sourceUrl, source);
      extractionMethod = "template";
    }
  } else {
    tour = generateTourFromGoal(goal, source?.sourceUrl, source);
    extractionMethod = "template";
  }

  await delay(200);
  onStage("complete", 5);

  return {
    tour,
    stepCount: tour.steps.filter((s) => !s.branchId).length,
    estimatedMinutes: tour.estimatedMinutes,
    branchCount: tour.branchCount,
    hasPrerequisites: hasPrerequisites || hasBranches,
    extractionMethod,
    distilled: extractionMethod !== "template",
  };
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
