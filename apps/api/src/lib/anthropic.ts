import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env";

/** True when ANTHROPIC_API_KEY is configured. The assistant route checks this and returns 503 if not. */
export const ASSISTANT_ENABLED = Boolean(env.ANTHROPIC_API_KEY);

const client = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

export interface AssistantContext {
  vehicle: {
    make: string;
    model: string;
    year: number;
    mileageKm: number | null;
    engine: string | null;
  };
  recentDtcCodes: string[];
  knowledge: { title: string; source: string; text: string }[];
  history: { role: "user" | "assistant"; content: string }[];
  question: string;
}

const SYSTEM_PROMPT = `You are AutoLife's automotive diagnostic assistant. You help a car owner understand symptoms, fault codes, maintenance, and repair decisions.

Rules:
- Ground your answer in the provided CAR CONTEXT and KNOWLEDGE. If they are insufficient, use your general automotive expertise but make clear when you are doing so.
- Be concrete and practical. When relevant, state whether it is safe to keep driving, the most likely causes, and the recommended next steps.
- Always end with a short note that this is guidance, not a substitute for inspection by a qualified mechanic. Never give advice that could be unsafe.
- Respond in the same language as the user's QUESTION.
- Be concise.`;

function buildContextBlock(ctx: AssistantContext): string {
  const v = ctx.vehicle;
  const lines = [
    "CAR CONTEXT:",
    `- Vehicle: ${v.make} ${v.model} ${v.year}${v.engine ? ` (${v.engine})` : ""}`,
    `- Mileage: ${v.mileageKm != null ? `${v.mileageKm} km` : "unknown"}`,
    `- Recent fault codes: ${ctx.recentDtcCodes.length ? ctx.recentDtcCodes.join(", ") : "none on record"}`,
    "",
    "KNOWLEDGE:",
  ];
  if (ctx.knowledge.length === 0) {
    lines.push("- (no matching knowledge-base entries; rely on general expertise)");
  } else {
    ctx.knowledge.forEach((k, i) => lines.push(`[${i + 1}] (${k.source}) ${k.title}: ${k.text}`));
  }
  return lines.join("\n");
}

export async function askAssistant(ctx: AssistantContext): Promise<string> {
  if (!client) {
    throw new Error("Assistant is not configured (missing ANTHROPIC_API_KEY)");
  }

  const messages: Anthropic.MessageParam[] = [
    ...ctx.history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: `${buildContextBlock(ctx)}\n\nQUESTION: ${ctx.question}` },
  ];

  const response = await client.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    system: SYSTEM_PROMPT,
    messages,
  });

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}
