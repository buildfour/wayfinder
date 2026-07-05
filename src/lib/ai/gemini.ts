import type { ExtractTourRequest, ExtractTourResult } from "./types";
import { runDistillationOrchestrator, type OrchestratorStage } from "./agents/orchestrator";
import { isGeminiConfigured } from "./agents/gemini";

export async function extractTourWithAI(
  req: ExtractTourRequest,
  onStage?: (stage: OrchestratorStage) => void
): Promise<ExtractTourResult & { agentTrace?: import("./agents/types").AgentTraceEntry[]; distilled?: boolean }> {
  const result = await runDistillationOrchestrator(req, onStage);
  return result;
}

export function isAIConfigured(): boolean {
  return isGeminiConfigured();
}
