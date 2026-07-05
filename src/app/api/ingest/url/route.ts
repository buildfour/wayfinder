import { NextResponse } from "next/server";
import { extractFromHtml, normalizeText } from "@/lib/ingest/extract";
import { createSourceDocument } from "@/lib/ingest/document";

export const runtime = "nodejs";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; WayfinderBot/1.0; +https://wayfinder.io/bot)",
  Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = typeof body.url === "string" ? body.url.trim() : "";

    if (!url) {
      return NextResponse.json({ success: false, error: "URL is required" }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid URL" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ success: false, error: "Only HTTP(S) URLs supported" }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch URL (${response.status})` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    const raw = await response.text();

    let title: string;
    let text: string;
    let excerpt: string;

    if (contentType.includes("text/html")) {
      const extracted = extractFromHtml(raw, url);
      title = extracted.title;
      text = extracted.text;
      excerpt = extracted.excerpt;
    } else if (contentType.includes("text/plain") || contentType.includes("text/markdown")) {
      text = normalizeText(raw);
      title = parsed.hostname + parsed.pathname;
      excerpt = text.slice(0, 280);
    } else {
      return NextResponse.json(
        { success: false, error: "URL content type not supported. Try uploading the file instead." },
        { status: 415 }
      );
    }

    if (text.length < 50) {
      return NextResponse.json(
        { success: false, error: "Could not extract enough text from this URL." },
        { status: 422 }
      );
    }

    const document = createSourceDocument({
      title,
      text,
      excerpt,
      sourceType: "url",
      sourceUrl: url,
    });

    return NextResponse.json({ success: true, document });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ingest failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
