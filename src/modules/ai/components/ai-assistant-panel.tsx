"use client";

import { Bot } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAiAgent } from "@/modules/ai/hooks/use-ai-agent";
import { cn } from "@/lib/utils";

interface AiAssistantPanelProps {
  className?: string;
  placeholder?: string;
}

export function AiAssistantPanel({
  className,
  placeholder = "Ask your Busal AI assistant…",
}: AiAssistantPanelProps) {
  const { run, isRunning, lastResult, agentSlug } = useAiAgent();
  const [input, setInput] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const message = input.trim();

    if (!message || isRunning) {
      return;
    }

    await run(message);
    setInput("");
  }

  return (
    <section
      className={cn("border-border bg-card flex flex-col gap-4 rounded-lg border p-4", className)}
      aria-label="AI Assistant"
    >
      <header className="flex items-center gap-2">
        <Bot className="text-primary h-5 w-5" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold">Busal AI Assistant</h2>
          <p className="text-muted-foreground text-xs">
            {agentSlug ? `Active agent: ${agentSlug}` : "Select an agent"}
          </p>
        </div>
      </header>

      {lastResult ? (
        <div className="bg-muted/50 rounded-md p-3 text-sm" role="status">
          {lastResult.response.content}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Mock AI core — no external providers connected. Ask anything to test the pipeline.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={placeholder}
          className="border-input bg-background focus-visible:ring-ring flex-1 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
          aria-label="Message to AI assistant"
          disabled={isRunning}
        />
        <Button type="submit" size="sm" disabled={isRunning || !input.trim()}>
          {isRunning ? "Thinking…" : "Send"}
        </Button>
      </form>
    </section>
  );
}
