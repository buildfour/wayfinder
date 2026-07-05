import { NextResponse } from "next/server";
import type { SourceDocument } from "@/lib/ingest/types";
import { extractTourWithAI, isAIConfigured } from "@/lib/ai/gemini";
import { buildTourFromExtraction, toExtractRequest } from "@/lib/ai/build-tour";
import type { Tour } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const goal = typeof body.goal === "string" ? body.goal.trim() : "";
    const source = body.source as SourceDocument | undefined;

    if (!goal) {
      return NextResponse.json({ success: false, error: "Goal is required" }, { status: 400 });
    }

    if (!source?.text || source.text.length < 30) {
      return NextResponse.json(
        { success: false, error: "Source document with text is required" },
        { status: 400 }
      );
    }

    const extractReq = toExtractRequest(goal, source);
    const result = await extractTourWithAI(extractReq);
    const tour: Tour = buildTourFromExtraction(result, goal, source);

    return NextResponse.json({
      success: true,
      tour,
      method: result.method,
      aiEnabled: isAIConfigured(),
      stepCount: tour.steps.filter((s) => !s.branchId).length,
      distilled: result.distilled ?? true,
      agentTrace: result.agentTrace,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ aiEnabled: isAIConfigured() });
}
