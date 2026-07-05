import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth-utils";
import { createConnectedSource, listConnectedSources } from "@/lib/data/settings";

export const runtime = "nodejs";

const PROVIDER_LABELS: Record<string, string> = {
  notion: "Notion",
  "google-drive": "Google Drive",
  confluence: "Confluence",
};

export async function GET() {
  const session = await requireUser();
  if (!session) return unauthorized();

  const sources = await listConnectedSources(session.user.id);
  return NextResponse.json({ success: true, sources });
}

export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) return unauthorized();

  const body = await request.json();
  const provider = typeof body.provider === "string" ? body.provider : "";

  if (!PROVIDER_LABELS[provider]) {
    return NextResponse.json({ success: false, error: "Unknown provider" }, { status: 400 });
  }

  const source = await createConnectedSource(
    session.user.id,
    provider,
    PROVIDER_LABELS[provider]
  );

  return NextResponse.json({
    success: true,
    source,
    message: `OAuth for ${PROVIDER_LABELS[provider]} will be available in a future update. Connection saved as pending.`,
  });
}
