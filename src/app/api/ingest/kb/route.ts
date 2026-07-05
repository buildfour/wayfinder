import { NextResponse } from "next/server";
import { KB_PROVIDERS } from "@/lib/ingest/document";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ providers: KB_PROVIDERS });
}
