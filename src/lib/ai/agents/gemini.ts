import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

function getApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY ?? process.env.gemini;
}

let client: GoogleGenAI | null | undefined;

export function getGeminiClient(): GoogleGenAI | null {
  if (client !== undefined) return client;
  const apiKey = getApiKey();
  client = apiKey ? new GoogleGenAI({ apiKey }) : null;
  return client;
}

export function isGeminiConfigured(): boolean {
  return !!getApiKey();
}

export async function geminiJson<T>(
  systemInstruction: string,
  userPrompt: string,
  temperature = 0.3
): Promise<T> {
  const ai = getGeminiClient();
  if (!ai) throw new Error("Gemini not configured");

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: userPrompt,
    config: {
      systemInstruction,
      temperature,
      responseMimeType: "application/json",
    },
  });

  const content = response.text;
  if (!content) throw new Error("Empty Gemini response");
  return JSON.parse(content) as T;
}

export async function geminiText(
  systemInstruction: string,
  userPrompt: string,
  temperature = 0.5
): Promise<string> {
  const ai = getGeminiClient();
  if (!ai) throw new Error("Gemini not configured");

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: userPrompt,
    config: {
      systemInstruction,
      temperature,
    },
  });

  const content = response.text;
  if (!content) throw new Error("Empty Gemini response");
  return content.trim();
}

export function truncateSource(text: string, max = 14000): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n\n[Document truncated…]";
}
