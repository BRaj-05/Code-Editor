import { NextRequest, NextResponse } from "next/server";
import {
  GeminiError,
  type GeminiMessage,
  type GeminiMode,
  generateGeminiContent,
} from "@/lib/gemini";

const MAX_MESSAGE_LENGTH = 20_000;
const validModes = new Set<GeminiMode>(["chat", "review", "fix", "optimize"]);

function parseHistory(value: unknown): GeminiMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (message): message is GeminiMessage =>
        typeof message === "object" &&
        message !== null &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0,
    )
    .slice(-10)
    .map((message) => ({ ...message, content: message.content.slice(0, MAX_MESSAGE_LENGTH) }));
}

export async function POST(request: NextRequest) {
  let body: { message?: unknown; history?: unknown; mode?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message must be between 1 and ${MAX_MESSAGE_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const mode: GeminiMode =
    typeof body.mode === "string" && validModes.has(body.mode as GeminiMode)
      ? (body.mode as GeminiMode)
      : "chat";

  try {
    const result = await generateGeminiContent({
      prompt: message,
      history: parseHistory(body.history),
      mode,
      systemInstruction:
        "You are VibeCode's AI coding assistant. Give precise, practical development help. Use Markdown only when it improves clarity.",
    });

    return NextResponse.json({
      response: result.text,
      model: result.model,
      tokens: result.tokens,
    });
  } catch (error) {
    const geminiError =
      error instanceof GeminiError
        ? error
        : new GeminiError("Unable to generate a response.", 502);
    return NextResponse.json({ error: geminiError.message }, { status: geminiError.status });
  }
}
