"use client";

import { useState, useTransition } from "react";

import { searchKnowledgeAction } from "@/modules/ai-knowledge/actions/ai-knowledge-actions";

export function AiKnowledgeSearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{
      documentTitle: string;
      content: string;
      score: number;
      sourceType: string;
    }>
  >([]);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <form
        className="flex flex-col gap-3 md:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            try {
              const response = await searchKnowledgeAction(query, 5);
              if (response.success) {
                setResults(
                  response.result.citations.map((citation) => ({
                    documentTitle: citation.documentTitle,
                    content: citation.content,
                    score: citation.score,
                    sourceType: citation.sourceType,
                  })),
                );
                setConfidence(response.result.confidenceScore);
              }
            } catch {
              setResults([]);
              setConfidence(null);
            }
          });
        }}
      >
        <input
          className="bg-background flex-1 rounded-md border px-3 py-2 text-sm"
          placeholder="Search business knowledge..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          type="submit"
          disabled={isPending || !query.trim()}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isPending ? "Searching..." : "Search"}
        </button>
      </form>

      {confidence != null ? (
        <p className="text-muted-foreground text-sm">
          Confidence score: {(confidence * 100).toFixed(0)}%
        </p>
      ) : null}

      <div className="space-y-3">
        {results.map((result, index) => (
          <div key={`${result.documentTitle}-${index}`} className="bg-card rounded-xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-medium">{result.documentTitle}</h3>
              <span className="text-muted-foreground text-xs">
                {(result.score * 100).toFixed(0)}% · {result.sourceType}
              </span>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">{result.content}</p>
          </div>
        ))}
        {!isPending && results.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Run a search to preview knowledge retrieval.
          </p>
        ) : null}
      </div>
    </div>
  );
}
