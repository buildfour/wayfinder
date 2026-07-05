import { NextResponse } from "next/server";
import type { Tour } from "@/lib/types";
import { getPublishedTour, savePublishedTour } from "@/lib/publish/store";
import { getPublicBaseUrl, getTourShareUrl } from "@/lib/publish/urls";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tour = await getPublishedTour(id);

  if (!tour) {
    return NextResponse.json({ success: false, error: "Tour not found" }, { status: 404 });
  }

  const baseUrl = getPublicBaseUrl(request);
  return NextResponse.json({
    success: true,
    tour,
    shareUrl: getTourShareUrl(baseUrl, id),
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const tour = body.tour as Tour | undefined;

    if (!tour || tour.id !== id) {
      return NextResponse.json(
        { success: false, error: "Invalid tour payload" },
        { status: 400 }
      );
    }

    const published = await savePublishedTour(tour);
    const baseUrl = getPublicBaseUrl(request);

    return NextResponse.json({
      success: true,
      tour: published,
      shareUrl: getTourShareUrl(baseUrl, id),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
