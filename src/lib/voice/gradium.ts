const GRADIUM_TTS_URL = "https://api.gradium.ai/api/post/speech/tts";
/** Default voice from Gradium docs quickstart */
const DEFAULT_VOICE_ID = "YTpq7expH9539ERJ";

function getApiKey(): string | undefined {
  return process.env.GRADIUM_API_KEY ?? process.env.gradium;
}

export function isGradiumConfigured(): boolean {
  return !!getApiKey();
}

export async function synthesizeSpeech(text: string): Promise<Buffer | null> {
  const apiKey = getApiKey();
  if (!apiKey || !text.trim()) return null;

  const trimmed = text.trim().slice(0, 1200);

  const res = await fetch(GRADIUM_TTS_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: trimmed,
      voice_id: process.env.GRADIUM_VOICE_ID ?? DEFAULT_VOICE_ID,
      output_format: "wav",
      only_audio: true,
    }),
  });

  if (!res.ok) {
    console.error("[gradium] TTS failed:", res.status, await res.text().catch(() => ""));
    return null;
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
