import { NextResponse } from "next/server";
import { isGradiumConfigured, synthesizeSpeech } from "@/lib/voice/gradium";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text) {
      return NextResponse.json({ success: false, error: "Text is required" }, { status: 400 });
    }

    if (!isGradiumConfigured()) {
      return NextResponse.json(
        { success: false, error: "Voice not configured", configured: false },
        { status: 503 }
      );
    }

    const audio = await synthesizeSpeech(text);
    if (!audio) {
      return NextResponse.json({ success: false, error: "Synthesis failed" }, { status: 502 });
    }

    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Voice failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ configured: isGradiumConfigured() });
}
