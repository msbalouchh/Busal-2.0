"use client";

import { useCallback, useState, type ReactNode } from "react";

interface AiMarkdownMessageProps {
  content: string;
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return part;
  });
}

export function AiMarkdownMessage({ content }: AiMarkdownMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [content]);

  const blocks = content.split("\n\n");

  return (
    <div className="space-y-3">
      <div className="prose prose-sm dark:prose-invert max-w-none space-y-2">
        {blocks.map((block, index) => {
          if (block.startsWith("### ")) {
            return (
              <h3 key={index} className="text-base font-semibold">
                {block.replace(/^### /, "")}
              </h3>
            );
          }

          if (block.startsWith("```")) {
            const code = block.replace(/^```[\w]*\n?/, "").replace(/```$/, "");
            return (
              <pre key={index} className="bg-muted overflow-x-auto rounded-lg border p-3 text-xs">
                <code>{code}</code>
              </pre>
            );
          }

          return (
            <p key={index} className="text-sm leading-relaxed">
              {renderInlineMarkdown(block)}
            </p>
          );
        })}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
      >
        {copied ? "Copied" : "Copy response"}
      </button>
    </div>
  );
}
