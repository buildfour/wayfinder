import { NextResponse } from "next/server";
import type { TourStep } from "@/lib/types";
import { runReorderAgent, validateStepOrder } from "@/lib/ai/agents/reorder-agent";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const goal = typeof body.goal === "string" ? body.goal.trim() : "";
    const steps = body.steps as TourStep[] | undefined;
    const analyzeOnly = body.analyzeOnly === true;

    if (!goal) {
      return NextResponse.json({ success: false, error: "Goal is required" }, { status: 400 });
    }

    if (!steps?.length) {
      return NextResponse.json({ success: false, error: "Steps are required" }, { status: 400 });
    }

    if (analyzeOnly) {
      return NextResponse.json({
        success: true,
        advice: {
          suggestions: [],
          issues: validateStepOrder(steps),
          method: "heuristic" as const,
        },
      });
    }

    const advice = await runReorderAgent(goal, steps);

    return NextResponse.json({ success: true, advice });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reorder analysis failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
