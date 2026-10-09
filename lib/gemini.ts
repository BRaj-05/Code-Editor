export type GeminiMode = "chat" | "review" | "fix" | "optimize";

export interface GeminiMessage {
  role: "user" | "assistant";
  content: string;
}

interface GeminiRequest {
  prompt: string;
  history?: GeminiMessage[];
  mode?: GeminiMode;
  systemInstruction: string;
  maxOutputTokens?: number;
}

interface GeminiResponse {
  text: string;
  model: string;
  tokens?: number;
}

export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

const modeInstructions: Record<GeminiMode, string> = {
  chat: "Answer the developer's question directly and accurately.",
  review: "Review the supplied code with concrete, actionable findings.",
  fix: "Identify the root cause and provide a focused fix.",
  optimize: "Suggest practical performance, readability, and maintainability improvements.",
};

export function stripCodeFences(value: string): string {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```[^\n]*\n([\s\S]*?)\n?```$/);
  return (fenced?.[1] ?? trimmed).trim();
}

export async function generateGeminiContent({
  prompt,
  history = [],
  mode = "chat",
  systemInstruction,
  maxOutputTokens = 1_000,
}: GeminiRequest): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError("Gemini is not configured on this server.", 503);
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  const requestBody = JSON.stringify({
    systemInstruction: {
      parts: [{ text: `${systemInstruction}\n${modeInstructions[mode]}` }],
    },
    contents: [
      ...history.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
      { role: "user", parts: [{ text: prompt }] },
    ],
    generationConfig: { maxOutputTokens, temperature: 0.4 },
  });

  try {
    let response: Response | undefined;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: requestBody,
        },
      );
      if ((response.status !== 429 && response.status !== 503) || attempt === 1) break;
      await new Promise((resolve) => setTimeout(resolve, 750));
    }

    if (!response) throw new GeminiError("Could not reach Gemini.", 502);

    const data = (await response.json().catch(() => null)) as {
      error?: { message?: string };
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: { totalTokenCount?: number };
    } | null;

    if (!response.ok) {
      throw new GeminiError(
        data?.error?.message || "Gemini could not complete this request.",
        response.status >= 400 && response.status < 600 ? response.status : 502,
      );
    }

    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();
    if (!text) {
      throw new GeminiError("Gemini returned an empty response.", 502);
    }

    return { text, model, tokens: data?.usageMetadata?.totalTokenCount };
  } catch (error) {
    if (error instanceof GeminiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new GeminiError("Gemini request timed out.", 504);
    }
    throw new GeminiError("Could not reach Gemini.", 502);
  } finally {
    clearTimeout(timeout);
  }
}
