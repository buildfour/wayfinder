import OpenAI from "openai";
import type { ExtractTourRequest, ExtractTourResult } from "./types";
import { EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt } from "./prompt";
import { extractTourHeuristic } from "./heuristic";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function extractTourWithAI(
  req: ExtractTourRequest
): Promise<ExtractTourResult> {
  if (!openai) {
    return extractTourHeuristic(req);
  }

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: buildExtractionUserPrompt(req.goal, req.sourceTitle, req.sourceText) },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty LLM response");

    const parsed = JSON.parse(content) as {
      title?: string;
      estimatedMinutes?: number;
      branchCount?: number;
      steps?: ExtractTourResult["steps"];
    };

    if (!parsed.steps || parsed.steps.length < 2) {
      throw new Error("Insufficient steps from LLM");
    }

    return {
      title: parsed.title ?? req.goal.slice(0, 50),
      steps: parsed.steps,
      estimatedMinutes: parsed.estimatedMinutes ?? Math.max(5, parsed.steps.length * 2),
      branchCount: parsed.branchCount ?? (parsed.steps.some((s) => s.type === "branch") ? 2 : 0),
      method: "openai",
    };
  } catch (err) {
    console.error("[extractTourWithAI] falling back to heuristic:", err);
    return extractTourHeuristic(req);
  }
}

export function isAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
