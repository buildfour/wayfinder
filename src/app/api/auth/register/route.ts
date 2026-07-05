import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth-utils";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail } from "@/lib/data/users";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Email and password (8+ chars) required" },
        { status: 400 }
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({
      email,
      name: name || email.split("@")[0],
      passwordHash,
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
