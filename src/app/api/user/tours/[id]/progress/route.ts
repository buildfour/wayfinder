import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth-utils";
import { getTourProgress, upsertTourProgress } from "@/lib/data/tours";
import type { TourProgress } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (!session) return unauthorized();

  const { id } = await params;
  const p = await getTourProgress(session.user.id, id);

  if (!p) {
    return NextResponse.json({ success: true, progress: null });
  }

  const completedStepIds =
    typeof p.completedStepIds === "string"
      ? (JSON.parse(p.completedStepIds) as string[])
      : p.completedStepIds;

  return NextResponse.json({
    success: true,
    progress: {
      tourId: id,
      currentStepIndex: p.currentStepIndex,
      completedStepIds,
      selectedBranch: p.selectedBranch,
      startTime: Number(p.startTime),
      elapsedMinutes: p.elapsedMinutes,
    },
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (!session) return unauthorized();

  const { id } = await params;
  const progress = (await request.json()).progress as TourProgress | undefined;

  if (!progress) {
    return NextResponse.json({ success: false, error: "Invalid progress" }, { status: 400 });
  }

  const ok = await upsertTourProgress(session.user.id, progress);
  if (!ok) {
    return NextResponse.json({ success: false, error: "Tour not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
