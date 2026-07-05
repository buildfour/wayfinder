import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth-utils";
import { getUserSettingsBundle, patchUserSettings } from "@/lib/data/settings";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireUser();
  if (!session) return unauthorized();

  const bundle = await getUserSettingsBundle(session.user.id);

  return NextResponse.json({
    success: true,
    user: bundle.user,
    settings: bundle.settings,
    connectedSources: bundle.connectedSources,
    teamMembers: bundle.teamMembers,
  });
}

export async function PATCH(request: Request) {
  const session = await requireUser();
  if (!session) return unauthorized();

  const body = await request.json();
  const settings = await patchUserSettings(session.user.id, body);

  return NextResponse.json({ success: true, settings });
}
