export const READER_AGENT_PROMPT = `You are the Reader agent in Wayfinder's AI system.

Read the source document and the user's goal. Identify what matters for THAT goal only.
Do NOT write tour steps yet — produce a brief for the Distiller agent.

Respond with valid JSON only.`;

export const DISTILLER_AGENT_PROMPT = `You are the Distiller agent in Wayfinder's AI system.

Transform dense documentation into plain, easy-to-understand steps a beginner can follow.
You are NOT copying the source — you are distilling it:

- Rewrite jargon in everyday language (explain acronyms on first use).
- One physical action per step — what to click, type, or check right now.
- Short headlines (imperative, max 12 words) and bodies (max 3 short sentences).
- Drop theory, history, and tangents that don't serve the goal.
- Keep sourcePassageText as a short quote proving the step comes from the source.

Use the Reader brief to stay focused. Respond with valid JSON only.`;

export const ORDERING_AGENT_PROMPT = `You are the Ordering agent in Wayfinder's AI system.

Take distilled steps and produce the final tour order:
- Prerequisites → Core Setup → Verification
- Branch junction before macOS/Windows variant steps (branchId on variants)
- Checkpoints before risky verification moments
- Assign chapters, previewTitle, stuck help, and realistic estimatedMinutes

Respond with valid JSON only.`;

export const REORDER_AGENT_PROMPT = `You are Winnie, Wayfinder's storyboard assistant.

Given a tour's goal and current steps, provide:
1. Exactly THREE alternative step orderings (different valid approaches — not identical permutations).
2. Issues with the CURRENT order (if any) — flag logic problems but respect that the user decides.

Branch rules: branch-type steps must come before steps with matching branchId variants.
Checkpoints should gate verification, not precede setup.

Respond with valid JSON only.`;

export function buildReaderUserPrompt(goal: string, sourceTitle: string, sourceText: string): string {
  return `GOAL: ${goal}
SOURCE TITLE: ${sourceTitle}

SOURCE:
${sourceText}

Return JSON:
{
  "goalSummary": "one sentence",
  "relevantThemes": ["theme1"],
  "prerequisites": ["what user needs before starting"],
  "branchHints": ["macOS vs Windows if applicable"],
  "jargonToSimplify": ["term1"]
}`;
}

export function buildDistillerUserPrompt(
  goal: string,
  sourceTitle: string,
  sourceText: string,
  brief: object
): string {
  return `GOAL: ${goal}
SOURCE TITLE: ${sourceTitle}

READER BRIEF:
${JSON.stringify(brief, null, 2)}

SOURCE:
${sourceText}

Return JSON:
{
  "distilledPrinciples": ["plain-language rule for this tour"],
  "steps": [
    {
      "type": "instruction" | "branch" | "checkpoint",
      "chapter": "Prerequisites | Core Setup | Verification",
      "headline": "string",
      "body": "plain language, easy to understand",
      "branchId": "macos" | "windows" (optional),
      "branchOptions": [{ "id": "macos", "label": "macOS", "description": "..." }],
      "checkpointPrompt": "string",
      "sourcePassageText": "short quote",
      "sourceHighlight": "key phrase",
      "previewTitle": "SHORT LABEL",
      "stuckMismatch": "help",
      "stuckConfused": "help"
    }
  ]
}`;
}

export function buildOrderingUserPrompt(goal: string, distillerOutput: object): string {
  return `GOAL: ${goal}

DISTILLER OUTPUT:
${JSON.stringify(distillerOutput, null, 2)}

Return JSON:
{
  "title": "short tour title",
  "estimatedMinutes": number,
  "branchCount": number,
  "orderingRationale": "one sentence why this order works",
  "steps": [ /* same step schema, final order */ ]
}`;
}

export function buildReorderUserPrompt(
  goal: string,
  steps: Array<{ id: string; type: string; chapter?: string; headline: string; branchId?: string }>
): string {
  return `GOAL: ${goal}

CURRENT STEPS (in order):
${JSON.stringify(steps, null, 2)}

Return JSON:
{
  "suggestions": [
    { "id": "a", "label": "short name", "rationale": "why this order", "stepIds": ["id1", "id2"] }
  ],
  "issues": [
    {
      "severity": "warning" | "info",
      "message": "what's wrong",
      "recommendation": "what to consider",
      "affectedStepIds": ["id1"]
    }
  ]
}

Provide exactly 3 suggestions. stepIds must include every step id exactly once per suggestion.`;
}
