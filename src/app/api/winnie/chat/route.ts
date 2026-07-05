import { NextResponse } from "next/server";
import { geminiText, isGeminiConfigured } from "@/lib/ai/agents/gemini";
import { WINNIE_SYSTEM_PROMPT, buildWinnieUserContext } from "@/lib/winnie/prompts";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const history = (body.history as ChatMessage[]) ?? [];
    const pagePath = typeof body.pagePath === "string" ? body.pagePath : "/";
    const context = body.context as
      | { goal?: string; tourTitle?: string; stepHeadline?: string }
      | undefined;

    if (!message) {
      return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json({
        success: true,
        reply: fallbackReply(message, pagePath),
        method: "heuristic",
      });
    }

    const contextBlock = buildWinnieUserContext(pagePath, context);
    const conversation = history
      .slice(-8)
      .map((m) => `${m.role === "user" ? "User" : "Winnie"}: ${m.content}`)
      .join("\n");

    const prompt = `${contextBlock}

Recent conversation:
${conversation || "(none)"}

User: ${message}

Reply as Winnie in plain text (no JSON).`;

    const reply = await geminiText(WINNIE_SYSTEM_PROMPT, prompt, 0.6);

    return NextResponse.json({
      success: true,
      reply: reply || "I'm here to help — try asking about creating a tour or editing steps.",
      method: "gemini",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Chat failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

function fallbackReply(message: string, pagePath: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("new tour") || lower.includes("create")) {
    return "Head to New Tour, paste a URL or upload a doc, then tell me your goal. Our agents will distill it into plain steps for you.";
  }
  if (pagePath.includes("/new/preview")) {
    return "You're on the storyboard — drag frames to reorder, or check my suggestions in the sidebar. Your order always wins.";
  }
  if (pagePath.includes("/play")) {
    return "Use Done, Next Step when you finish each action. Tap I'm stuck if something doesn't match your screen.";
  }
  return "I'm Winnie! Ask me about creating tours, editing steps, or playing through a guide. (AI chat needs GEMINI_API_KEY for richer answers.)";
}
