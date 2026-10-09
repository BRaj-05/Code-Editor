import { type NextRequest, NextResponse } from "next/server";
import {
  GeminiError,
  generateGeminiContent,
  stripCodeFences,
} from "@/lib/gemini";

const MAX_CONTENT_LENGTH = 100_000;

interface CompletionRequest {
  fileContent?: unknown;
  cursorLine?: unknown;
  cursorColumn?: unknown;
  suggestionType?: unknown;
  fileName?: unknown;
}

function isValidPosition(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export async function POST(request: NextRequest) {
  let body: CompletionRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const { fileContent, cursorLine, cursorColumn, suggestionType, fileName } = body;
  if (
    typeof fileContent !== "string" ||
    fileContent.length > MAX_CONTENT_LENGTH ||
    !isValidPosition(cursorLine) ||
    !isValidPosition(cursorColumn) ||
    typeof suggestionType !== "string" ||
    !suggestionType.trim()
  ) {
    return NextResponse.json({ error: "Invalid completion request." }, { status: 400 });
  }

  const lines = fileContent.split("\n");
  if (cursorLine >= lines.length || cursorColumn > (lines[cursorLine]?.length ?? 0)) {
    return NextResponse.json({ error: "Cursor position is outside the file." }, { status: 400 });
  }

  const fileLabel = typeof fileName === "string" && fileName.trim() ? fileName.trim() : "untitled";
  const contextStart = Math.max(0, cursorLine - 20);
  const contextEnd = Math.min(lines.length, cursorLine + 21);
  const context = lines.slice(contextStart, contextEnd).join("\n");

  try {
    const result = await generateGeminiContent({
      prompt: [
        `File: ${fileLabel}`,
        `Completion type: ${suggestionType.trim()}`,
        `Cursor: line ${cursorLine + 1}, column ${cursorColumn + 1}`,
        "Return only the code to insert at the cursor. Do not use Markdown fences or explanations.",
        "Relevant file context:",
        context,
      ].join("\n\n"),
      systemInstruction:
        "You complete source code in an existing project. Preserve the local language, indentation, style, and syntax. Keep the result concise.",
      maxOutputTokens: 300,
    });

    return NextResponse.json({
      suggestion: stripCodeFences(result.text),
      model: result.model,
      tokens: result.tokens,
    });
  } catch (error) {
    const geminiError =
      error instanceof GeminiError
        ? error
        : new GeminiError("Unable to generate a completion.", 502);
    return NextResponse.json({ error: geminiError.message }, { status: geminiError.status });
  }
}
