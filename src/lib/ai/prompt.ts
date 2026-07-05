export const EXTRACTION_SYSTEM_PROMPT = `You are Wayfinder's legacy extraction prompt. Production uses the Reader → Distiller → Ordering agent pipeline.

Distill documentation into plain, easy-to-understand steps — do not copy jargon verbatim.`;

export function buildExtractionUserPrompt(
  goal: string,
  sourceTitle: string,
  sourceText: string
): string {
  const truncated =
    sourceText.length > 14000
      ? sourceText.slice(0, 14000) + "\n\n[Document truncated…]"
      : sourceText;

  return `GOAL: ${goal}

SOURCE TITLE: ${sourceTitle}

SOURCE DOCUMENT:
${truncated}

Return JSON matching this schema:
{
  "title": "short tour title",
  "estimatedMinutes": number,
  "branchCount": number,
  "steps": [
    {
      "type": "instruction" | "branch" | "checkpoint",
      "chapter": "Prerequisites | Core Setup | Verification",
      "headline": "string",
      "body": "string",
      "branchId": "macos" | "windows" (only on branch-specific steps),
      "branchOptions": [{ "id": "macos", "label": "macOS", "description": "..." }, { "id": "windows", "label": "Windows", "description": "..." }],
      "checkpointPrompt": "verification question",
      "sourcePassageText": "quoted from source",
      "sourceHighlight": "key phrase",
      "previewTitle": "SHORT CAPS LABEL",
      "stuckMismatch": "help text",
      "stuckConfused": "help text"
    }
  ]
}`;
}
