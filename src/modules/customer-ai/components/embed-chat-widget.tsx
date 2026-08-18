"use client";

import { useEffect, useState } from "react";

import { CustomerAiChatPanel } from "@/modules/customer-ai/components/customer-ai-chat-panel";

interface EmbedChatWidgetProps {
  businessId: string;
  token: string;
}

export function EmbedChatWidget({ token }: EmbedChatWidgetProps) {
  const [config, setConfig] = useState<{
    aiName: string;
    aiAvatarUrl: string | null;
    aiGreeting: string | null;
    businessName: string;
    enabled: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch(`/api/embed/chat?token=${encodeURIComponent(token)}`);
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? "Unable to load AI config");
        }
        setConfig(payload.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load chat");
      }
    }

    void loadConfig();
  }, [token]);

  if (error && !config) {
    return <p className="text-destructive p-4 text-sm">{error}</p>;
  }

  if (!config) {
    return <p className="text-muted-foreground p-4 text-sm">Loading assistant…</p>;
  }

  const greeting =
    config.aiGreeting?.trim() ||
    `Hi! I'm ${config.aiName}, the AI assistant for ${config.businessName}. How can I help you today?`;

  return (
    <CustomerAiChatPanel
      aiName={config.aiName}
      aiAvatarUrl={config.aiAvatarUrl}
      businessLabel={config.businessName}
      greeting={greeting}
      enabled={config.enabled}
      showVerification
      onSend={async ({ message, conversationId, sessionToken, confirmedActions }) => {
        const response = await fetch("/api/embed/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            message,
            conversationId,
            sessionToken,
            confirmedActions,
          }),
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? "Unable to send message");
        }

        const data = payload.data;
        const requiresVerification = Array.isArray(data.toolResults)
          ? data.toolResults.some(
              (entry: { output?: { requiresVerification?: boolean } }) =>
                entry.output?.requiresVerification,
            )
          : false;

        return {
          conversationId: data.conversationId,
          sessionToken: data.sessionToken,
          content: data.content,
          requiresConfirmation: data.requiresConfirmation,
          requiresVerification,
        };
      }}
      onVerify={async ({ sessionToken, email, phone, orderReference }) => {
        const response = await fetch("/api/embed/chat/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            sessionToken,
            email,
            phone,
            orderReference,
          }),
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? "Verification failed");
        }
        return payload.data;
      }}
    />
  );
}
