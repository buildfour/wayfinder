import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth-utils";
import { deleteUserTour, getUserTour, getTourProgress, upsertUserTour } from "@/lib/data/tours";
import type { Tour, TourProgress } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (!session) return unauthorized();

  const { id } = await params;
  const record = await getUserTour(session.user.id, id);

  if (!record) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const p = await getTourProgress(session.user.id, id);
  const progress = p
    ? ({
        tourId: id,
        currentStepIndex: p.currentStepIndex,
        completedStepIds:
          typeof p.completedStepIds === "string"
            ? (JSON.parse(p.completedStepIds) as string[])
            : p.completedStepIds,
        selectedBranch: p.selectedBranch,
        startTime: Number(p.startTime),
        elapsedMinutes: p.elapsedMinutes,
      } satisfies TourProgress)
    : null;

  return NextResponse.json({
    success: true,
    tour: JSON.parse(record.data) as Tour,
    progress,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await request.json();
  const tour = body.tour as Tour | undefined;

  if (!tour || tour.id !== id) {
    return NextResponse.json({ success: false, error: "Invalid tour" }, { status: 400 });
  }

  const owned = await getUserTour(session.user.id, id);
  if (!owned) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  await upsertUserTour(session.user.id, tour);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (!session) return unauthorized();

  const { id } = await params;
  const deleted = await deleteUserTour(session.user.id, id);
  if (!deleted) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
