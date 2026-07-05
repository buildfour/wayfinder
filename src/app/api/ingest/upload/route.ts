import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { normalizeText, buildExcerpt } from "@/lib/ingest/extract";
import { createSourceDocument } from "@/lib/ingest/document";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

async function parsePdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return normalizeText(result.text ?? "");
  } finally {
    await parser.destroy();
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: "File exceeds 10 MB limit" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name;
    const mime = file.type || guessMime(name);

    let text = "";

    if (mime === "application/pdf" || name.endsWith(".pdf")) {
      text = await parsePdf(buffer);
    } else if (
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = normalizeText(result.value);
    } else if (
      mime.startsWith("text/") ||
      name.endsWith(".md") ||
      name.endsWith(".markdown") ||
      name.endsWith(".txt")
    ) {
      text = normalizeText(buffer.toString("utf-8"));
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported file type. Use PDF, DOCX, Markdown, or plain text.",
        },
        { status: 415 }
      );
    }

    if (text.length < 30) {
      return NextResponse.json(
        { success: false, error: "Could not extract enough text from this file." },
        { status: 422 }
      );
    }

    const document = createSourceDocument({
      title: name.replace(/\.[^.]+$/, ""),
      text,
      excerpt: buildExcerpt(text),
      sourceType: "upload",
      fileName: name,
      mimeType: mime,
    });

    return NextResponse.json({ success: true, document });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload parse failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

function guessMime(name: string): string {
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (name.endsWith(".md")) return "text/markdown";
  return "text/plain";
}
