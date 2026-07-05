import { NextResponse } from "next/server";
import { refreshTourSync } from "@/lib/publish/store";
import { getPublicBaseUrl, getTourShareUrl } from "@/lib/publish/urls";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tour = await refreshTourSync(id);

  if (!tour) {
    return NextResponse.json({ success: false, error: "Tour not found" }, { status: 404 });
  }

  const baseUrl = getPublicBaseUrl(request);
  return NextResponse.json({
    success: true,
    tour,
    shareUrl: getTourShareUrl(baseUrl, id),
    message: "Source sync timestamp updated. Full re-ingest ships in Phase 6.",
  });
}
