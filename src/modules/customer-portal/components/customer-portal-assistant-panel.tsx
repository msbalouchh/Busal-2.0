"use client";

import { useState, useTransition } from "react";
import { Bot } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sendCustomerAssistantMessageAction } from "@/modules/customer-portal/actions/customer-portal-actions";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function CustomerPortalAssistantPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const sendMessage = () => {
    const content = input.trim();
    if (!content || isPending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");

    startTransition(async () => {
      try {
        const result = await sendCustomerAssistantMessageAction({
          content,
          conversationId,
        });
        setConversationId(result.conversationId);
        setMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: result.reply,
          },
        ]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to send message.");
      }
    });
  };

  return (
    <Card className="flex min-h-[32rem] flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-4 w-4" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="bg-muted/30 flex-1 space-y-3 overflow-y-auto rounded-md border p-4">
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Ask about your orders, loyalty points, reservations, or menu recommendations.
            </p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "bg-primary text-primary-foreground ml-8 rounded-lg px-3 py-2 text-sm"
                    : "bg-background mr-8 rounded-lg border px-3 py-2 text-sm"
                }
              >
                {message.content}
              </div>
            ))
          )}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type your question..."
            disabled={isPending}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 flex-1 rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button type="submit" disabled={isPending || !input.trim()}>
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
