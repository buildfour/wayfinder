import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth-utils";
import { listUserTours, upsertUserTour } from "@/lib/data/tours";
import type { Tour } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireUser();
  if (!session) return unauthorized();

  const records = await listUserTours(session.user.id);
  const tours = records.map((r) => JSON.parse(r.data) as Tour);

  return NextResponse.json({ success: true, tours, records });
}

export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) return unauthorized();

  const body = await request.json();
  const tour = body.tour as Tour | undefined;
  if (!tour?.id) {
    return NextResponse.json({ success: false, error: "Invalid tour" }, { status: 400 });
  }

  await upsertUserTour(session.user.id, tour);

  return NextResponse.json({ success: true });
}
