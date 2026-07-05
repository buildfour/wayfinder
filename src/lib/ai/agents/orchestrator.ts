import type { ExtractTourRequest, ExtractTourResult } from "../types";
import type { AgentTraceEntry } from "./types";
import { isGeminiConfigured } from "./gemini";
import { runReaderAgent } from "./reader-agent";
import { runDistillerAgent } from "./distiller-agent";
import { runOrderingAgent } from "./ordering-agent";
import { runQualityAgent } from "./quality-agent";
import { runPedagogyAgent } from "./pedagogy-agent";
import { runFidelityAgent } from "./fidelity-agent";
import { extractTourHeuristic } from "../heuristic";

export type OrchestratorStage =
  | "reading"
  | "distilling"
  | "ordering"
  | "quality"
  | "pedagogy"
  | "fidelity";

export interface OrchestratorResult extends ExtractTourResult {
  agentTrace: AgentTraceEntry[];
  distilled: boolean;
}

export async function runDistillationOrchestrator(
  req: ExtractTourRequest,
  onStage?: (stage: OrchestratorStage) => void
): Promise<OrchestratorResult> {
  if (!isGeminiConfigured()) {
    const heuristic = extractTourHeuristic(req);
    return {
      ...heuristic,
      method: "heuristic",
      distilled: true,
      agentTrace: [
        {
          agent: "orchestrator",
          label: "Orchestrator",
          summary: "No API key — heuristic distillation",
        },
      ],
    };
  }

  const trace: AgentTraceEntry[] = [];

  try {
    onStage?.("reading");
    const { brief, trace: readerTrace } = await runReaderAgent(req);
    trace.push(readerTrace);

    onStage?.("distilling");
    const { output: distilled, trace: distillerTrace } = await runDistillerAgent(req, brief);
    trace.push(distillerTrace);

    onStage?.("ordering");
    const { output: ordered, trace: orderingTrace } = await runOrderingAgent(req, distilled);
    trace.push(orderingTrace);

    onStage?.("quality");
    const { steps: qualitySteps, trace: qualityTrace } = await runQualityAgent(ordered.steps);
    trace.push(qualityTrace);

    onStage?.("pedagogy");
    const { steps: pedagogySteps, trace: pedagogyTrace } = await runPedagogyAgent(qualitySteps);
    trace.push(pedagogyTrace);

    onStage?.("fidelity");
    const { steps: finalSteps, trace: fidelityTrace } = await runFidelityAgent(req, pedagogySteps);
    trace.push(fidelityTrace);

    trace.push({
      agent: "orchestrator",
      label: "Orchestrator",
      summary: "6-agent distillation pipeline complete",
    });

    return {
      title: ordered.title,
      steps: finalSteps,
      estimatedMinutes: ordered.estimatedMinutes,
      branchCount: ordered.branchCount,
      method: "gemini",
      distilled: true,
      agentTrace: trace,
    };
  } catch (err) {
    console.error("[orchestrator] pipeline failed, falling back:", err);
    const heuristic = extractTourHeuristic(req);
    return {
      ...heuristic,
      method: "heuristic",
      distilled: true,
      agentTrace: [
        ...trace,
        {
          agent: "orchestrator",
          label: "Orchestrator",
          summary: "Pipeline fallback to heuristic",
        },
      ],
    };
  }
}
