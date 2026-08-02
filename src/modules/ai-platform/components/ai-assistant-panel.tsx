"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { AI_ASSISTANT_SUGGESTED_PROMPTS } from "@/modules/ai-platform/constants/ai-platform";
import { sendAssistantMessageAction } from "@/modules/ai-platform/actions/ai-platform-actions";
import { AiMarkdownMessage } from "@/modules/ai-platform/components/ai-markdown-message";
import type { AssistantChatResponse } from "@/modules/ai-platform/types/ai-platform-types";
import type {
  KnowledgeCollectionView,
  KnowledgeSearchAuditView,
} from "@/modules/ai-knowledge/utils/ai-knowledge-utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: AssistantChatResponse["citations"];
  streaming?: boolean;
}

interface AiAssistantPanelProps {
  collections: KnowledgeCollectionView[];
  recentSearches: KnowledgeSearchAuditView[];
  canManageKnowledge: boolean;
}

function createMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AiAssistantPanel({
  collections,
  recentSearches,
  canManageKnowledge,
}: AiAssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  const streamAssistantContent = (messageId: string, fullContent: string) => {
    const chunkSize = Math.max(Math.floor(fullContent.length / 24), 12);
    let index = 0;

    const interval = window.setInterval(() => {
      index = Math.min(index + chunkSize, fullContent.length);
      const partial = fullContent.slice(0, index);

      setMessages((current) =>
        current.map((message) =>
          message.id === messageId
            ? { ...message, content: partial, streaming: index < fullContent.length }
            : message,
        ),
      );

      if (index >= fullContent.length) {
        window.clearInterval(interval);
      }
    }, 30);
  };

  const submitMessage = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || isPending) {
      return;
    }

    setError(null);
    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: attachedFileName ? `${trimmed}\n\n_(Attachment: ${attachedFileName})_` : trimmed,
    };
    const assistantId = createMessageId();

    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);
    setInput("");
    setAttachedFileName(null);

    startTransition(async () => {
      try {
        const response = await sendAssistantMessageAction({
          message: trimmed,
          collectionIds: selectedCollections.length > 0 ? selectedCollections : undefined,
        });

        if (response.success) {
          setMessages((current) =>
            current.map((entry) =>
              entry.id === assistantId
                ? {
                    ...entry,
                    citations: response.response.citations,
                  }
                : entry,
            ),
          );
          streamAssistantContent(assistantId, response.response.content);
        }
      } catch (submitError) {
        setMessages((current) => current.filter((entry) => entry.id !== assistantId));
        setError(submitError instanceof Error ? submitError.message : "Assistant request failed");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-4">
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 text-sm font-semibold">Context</h2>
          {collections.length === 0 ? (
            <p className="text-muted-foreground text-sm">No knowledge collections yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {collections.map((collection) => (
                <li key={collection.id}>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedCollections.includes(collection.id)}
                      onChange={(event) => {
                        setSelectedCollections((current) =>
                          event.target.checked
                            ? [...current, collection.id]
                            : current.filter((id) => id !== collection.id),
                        );
                      }}
                    />
                    <span>{collection.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-2 text-sm font-semibold">Suggested prompts</h2>
          <div className="flex flex-col gap-2">
            {AI_ASSISTANT_SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="hover:bg-muted rounded-md border px-3 py-2 text-left text-sm"
                onClick={() => submitMessage(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {recentSearches.length > 0 ? (
          <div className="rounded-lg border p-4">
            <h2 className="mb-2 text-sm font-semibold">History</h2>
            <ul className="space-y-2 text-sm">
              {recentSearches.slice(0, 8).map((search) => (
                <li key={search.id}>
                  <button
                    type="button"
                    className="hover:text-primary text-left"
                    onClick={() => submitMessage(search.query)}
                  >
                    {search.query}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>

      <section className="flex min-h-[560px] flex-col rounded-lg border">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center text-center text-sm">
              <p className="text-foreground font-medium">Ask Busal AI</p>
              <p className="mt-1 max-w-md">
                Search your business knowledge with context-aware responses, citations, and markdown
                formatting.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "bg-primary/10 ml-auto max-w-3xl rounded-lg p-3 text-sm"
                    : "bg-muted/40 max-w-3xl rounded-lg p-3"
                }
              >
                {message.role === "assistant" ? (
                  message.streaming && !message.content ? (
                    <p className="text-muted-foreground text-sm">Assistant is typing...</p>
                  ) : (
                    <AiMarkdownMessage content={message.content} />
                  )
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
                {message.citations && message.citations.length > 0 ? (
                  <div className="mt-3 space-y-2 border-t pt-3 text-xs">
                    <p className="font-medium">Citations</p>
                    {message.citations.map((citation, index) => (
                      <p
                        key={`${citation.documentTitle}-${index}`}
                        className="text-muted-foreground"
                      >
                        {citation.documentTitle} · {(citation.score * 100).toFixed(0)}%
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          )}
          {isPending ? (
            <p className="text-muted-foreground text-sm" aria-live="polite">
              Retrieving knowledge...
            </p>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        <form
          className="space-y-3 border-t p-4"
          onSubmit={(event) => {
            event.preventDefault();
            submitMessage(input);
          }}
        >
          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm">
              <span className="sr-only">Attach file reference</span>
              <input
                type="file"
                className="text-sm"
                disabled={!canManageKnowledge}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setAttachedFileName(file?.name ?? null);
                }}
              />
            </label>
            {attachedFileName ? (
              <span className="text-muted-foreground text-xs">
                Reference: {attachedFileName}. Upload documents in Knowledge to index files.
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <textarea
              className="bg-background min-h-[88px] flex-1 rounded-md border px-3 py-2 text-sm"
              placeholder="Ask a question about your business knowledge..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              aria-label="Assistant message"
            />
            <button
              type="submit"
              disabled={isPending || !input.trim()}
              className="bg-primary text-primary-foreground h-fit rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {isPending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
