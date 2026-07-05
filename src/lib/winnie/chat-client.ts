export interface WinnieChatResponse {
  success: boolean;
  reply?: string;
  method?: string;
  error?: string;
}

export async function sendWinnieMessage(
  message: string,
  options: {
    pagePath: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
    context?: { goal?: string; tourTitle?: string; stepHeadline?: string };
  }
): Promise<WinnieChatResponse> {
  const res = await fetch("/api/winnie/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      pagePath: options.pagePath,
      history: options.history,
      context: options.context,
    }),
  });
  return res.json();
}
