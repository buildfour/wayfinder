import { NextResponse } from "next/server";
import { KB_PROVIDERS } from "@/lib/ingest/document";

export const runtime = "nodejs";

const PROVIDER_NAMES: Record<string, string> = {
  notion: "Notion",
  "google-drive": "Google Drive",
  confluence: "Confluence",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const known = KB_PROVIDERS.find((p) => p.id === provider);

  if (!known) {
    return NextResponse.json({ success: false, error: "Unknown provider" }, { status: 404 });
  }

  return NextResponse.json({
    success: false,
    status: "oauth_required",
    provider: known.id,
    name: PROVIDER_NAMES[provider] ?? provider,
    message: `${PROVIDER_NAMES[provider] ?? provider} integration requires OAuth. Connect your account in Settings → Connected Sources (coming in Phase 6).`,
    oauthPlaceholder: `https://wayfinder.io/oauth/${provider}?redirect=/new`,
    available: false,
  });
}
