import { useCallback, useState } from "react";

interface AISuggestionsState {
  suggestion: string | null;
  isLoading: boolean;
  position: { line: number; column: number } | null;
  decoration: string[];
  isEnabled: boolean;
}

interface UseAISuggestionsReturn extends AISuggestionsState {
  toggleEnabled: () => void;
  fetchSuggestion: (type: string, editor: any, fileName?: string) => Promise<void>;
  acceptSuggestion: (editor: any, monaco: any) => void;
  rejectSuggestion: (editor: any) => void;
  clearSuggestion: (editor: any) => void;
}

export const useAISuggestions = (): UseAISuggestionsReturn => {
  const [state, setState] = useState<AISuggestionsState>({ suggestion: null, isLoading: false, position: null, decoration: [], isEnabled: true });

  const clearSuggestion = useCallback((editor: any) => {
    setState((current) => {
      if (editor && current.decoration.length) editor.deltaDecorations(current.decoration, []);
      return { ...current, suggestion: null, position: null, decoration: [] };
    });
  }, []);

  const toggleEnabled = useCallback(() => {
    setState((current) => ({ ...current, isEnabled: !current.isEnabled }));
  }, []);

  const fetchSuggestion = useCallback(async (type: string, editor: any, fileName?: string) => {
    if (!state.isEnabled || !editor) return;
    const model = editor.getModel();
    const cursorPosition = editor.getPosition();
    if (!model || !cursorPosition) return;

    setState((current) => ({ ...current, isLoading: true }));
    try {
      const response = await fetch("/api/code-completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileContent: model.getValue(), cursorLine: cursorPosition.lineNumber - 1, cursorColumn: cursorPosition.column - 1, suggestionType: type, fileName }),
      });
      const data = (await response.json()) as { suggestion?: unknown };
      if (!response.ok || typeof data.suggestion !== "string" || !data.suggestion.trim()) throw new Error("No completion was returned.");
      const suggestion = data.suggestion;

      setState((current) => ({ ...current, suggestion: suggestion.trim(), position: { line: cursorPosition.lineNumber, column: cursorPosition.column }, isLoading: false }));
    } catch {
      setState((current) => ({ ...current, isLoading: false }));
    }
  }, [state.isEnabled]);

  const acceptSuggestion = useCallback((editor: any, monaco: any) => {
    setState((current) => {
      if (!current.suggestion || !current.position || !editor || !monaco) return current;
      editor.executeEdits("ai-suggestion", [{ range: new monaco.Range(current.position.line, current.position.column, current.position.line, current.position.column), text: current.suggestion.replace(/^\d+:\s*/gm, ""), forceMoveMarkers: true }]);
      if (current.decoration.length) editor.deltaDecorations(current.decoration, []);
      return { ...current, suggestion: null, position: null, decoration: [] };
    });
  }, []);

  const rejectSuggestion = useCallback((editor: any) => clearSuggestion(editor), [clearSuggestion]);

  return { ...state, toggleEnabled, fetchSuggestion, acceptSuggestion, rejectSuggestion, clearSuggestion };
};
