import type { Tour, TourStep } from "@/lib/types";
import type { SourceDocument } from "@/lib/ingest/types";
import type { ExtractedStepRaw, ExtractTourRequest, ExtractTourResult } from "./types";
import { slugify } from "@/lib/tour-engine";

export function buildTourFromExtraction(
  result: ExtractTourResult,
  goal: string,
  source: SourceDocument
): Tour {
  const steps: TourStep[] = result.steps.map((raw, i) => rawToStep(raw, i, source));

  return {
    id: `${slugify(result.title) || slugify(goal) || "tour"}-${Date.now().toString(36)}`,
    title: result.title,
    sourceTitle: source.title,
    sourceUrl: source.sourceUrl,
    goal,
    estimatedMinutes: result.estimatedMinutes,
    branchCount: result.branchCount,
    steps,
    createdAt: new Date().toISOString(),
    sourceText: source.text,
    sourceExcerpt: source.excerpt,
    lastSynced: new Date().toISOString(),
  };
}

function rawToStep(raw: ExtractedStepRaw, index: number, source: SourceDocument): TourStep {
  const id = `step-${index + 1}-${slugify(raw.headline).slice(0, 20) || index}`;

  const step: TourStep = {
    id,
    type: raw.type,
    chapter: raw.chapter,
    headline: raw.headline,
    body: raw.body,
    branchId: raw.branchId,
    previewTitle: raw.previewTitle ?? raw.headline.slice(0, 28).toUpperCase(),
    previewDescription: raw.body.slice(0, 80),
    sourceAnchor: (index + 1) / (index + 5),
  };

  if (raw.sourcePassageText) {
    step.sourcePassage = {
      text: raw.sourcePassageText,
      highlight: raw.sourceHighlight,
      attribution: source.title,
      section: raw.chapter ?? "Source",
      url: source.sourceUrl,
    };
  }

  if (raw.stuckMismatch || raw.stuckConfused) {
    step.stuckHelp = {
      mismatch: raw.stuckMismatch
        ? { message: raw.stuckMismatch, quote: raw.sourceHighlight }
        : undefined,
      confused: raw.stuckConfused ? { message: raw.stuckConfused } : undefined,
    };
  }

  if (raw.type === "branch" && raw.branchOptions) {
    step.branchOptions = raw.branchOptions.map((opt, i) => ({
      id: opt.id,
      label: opt.label,
      description: opt.description,
      cta: i === 0 ? "← CHOOSE THIS PATH" : "CHOOSE THIS PATH →",
      accent: opt.id === "macos" ? "cobalt" : "amber",
    }));
  }

  if (raw.type === "checkpoint") {
    step.checkpointPrompt = raw.checkpointPrompt ?? raw.headline;
    step.checkpointYes = "✓ Yes, I can see it";
    step.checkpointNo = "✗ Not yet";
    step.checkpointDiagnostic =
      raw.stuckMismatch ??
      "Re-check the source document for timing, prerequisites, or environment-specific caveats.";
  }

  return step;
}

export function toExtractRequest(goal: string, source: SourceDocument): ExtractTourRequest {
  return {
    goal,
    sourceTitle: source.title,
    sourceText: source.text,
    sourceUrl: source.sourceUrl,
  };
}
