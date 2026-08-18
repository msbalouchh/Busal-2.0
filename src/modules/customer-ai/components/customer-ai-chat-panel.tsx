"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

export interface CustomerAiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface PendingConfirmation {
  actionId: string;
  description: string;
}

export interface CustomerAiChatSendResult {
  conversationId: string;
  sessionToken: string;
  content: string;
  requiresConfirmation?: PendingConfirmation[];
  requiresVerification?: boolean;
}

export interface CustomerAiChatPanelProps {
  aiName: string;
  aiAvatarUrl?: string | null;
  businessLabel: string;
  greeting: string;
  enabled?: boolean;
  showVerification?: boolean;
  onSend: (input: {
    message: string;
    conversationId?: string;
    sessionToken?: string;
    confirmedActions?: string[];
  }) => Promise<CustomerAiChatSendResult>;
  onVerify?: (input: {
    sessionToken: string;
    email?: string;
    phone?: string;
    orderReference?: string;
  }) => Promise<{ verified: boolean }>;
}

export function CustomerAiChatPanel({
  aiName,
  aiAvatarUrl,
  businessLabel,
  greeting,
  enabled = true,
  showVerification = false,
  onSend,
  onVerify,
}: CustomerAiChatPanelProps) {
  const [messages, setMessages] = useState<CustomerAiChatMessage[]>([
    { id: "greeting", role: "assistant", content: greeting },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [sessionToken, setSessionToken] = useState<string | undefined>();
  const [pendingConfirmations, setPendingConfirmations] = useState<PendingConfirmation[]>([]);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyPhone, setVerifyPhone] = useState("");
  const [verifyOrderRef, setVerifyOrderRef] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingConfirmations, requiresVerification]);

  const applyResult = useCallback((result: CustomerAiChatSendResult) => {
    setConversationId(result.conversationId);
    setSessionToken(result.sessionToken);
    setPendingConfirmations(result.requiresConfirmation ?? []);
    setRequiresVerification(Boolean(result.requiresVerification));
    setMessages((current) => [
      ...current,
      { id: `assistant-${Date.now()}`, role: "assistant", content: result.content },
    ]);
  }, []);

  const sendMessage = async (message: string, confirmedActions?: string[]) => {
    const trimmed = message.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    if (!confirmedActions?.length) {
      setMessages((current) => [
        ...current,
        { id: `user-${Date.now()}`, role: "user", content: trimmed },
      ]);
    }

    try {
      const result = await onSend({
        message: trimmed,
        conversationId,
        sessionToken,
        confirmedActions,
      });
      applyResult(result);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (actionId: string) => {
    setPendingConfirmations((current) => current.filter((item) => item.actionId !== actionId));
    await sendMessage("Yes, please confirm and proceed.", [actionId]);
  };

  const handleCancelConfirmation = (actionId: string) => {
    setPendingConfirmations((current) => current.filter((item) => item.actionId !== actionId));
    setMessages((current) => [
      ...current,
      {
        id: `assistant-cancel-${Date.now()}`,
        role: "assistant",
        content: "No problem — I won't proceed with that action.",
      },
    ]);
  };

  const handleVerify = async () => {
    if (!onVerify || !sessionToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await onVerify({
        sessionToken,
        email: verifyEmail.trim() || undefined,
        phone: verifyPhone.trim() || undefined,
        orderReference: verifyOrderRef.trim() || undefined,
      });
      if (result.verified) {
        setRequiresVerification(false);
        setMessages((current) => [
          ...current,
          {
            id: `assistant-verified-${Date.now()}`,
            role: "assistant",
            content: "Thanks — your identity is verified. You can ask about your orders or reservations now.",
          },
        ]);
      } else {
        setError("We couldn't verify your account. Check your details and try again.");
      }
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  if (!enabled) {
    return (
      <p className="text-muted-foreground p-4 text-sm">
        AI assistant is not available for {businessLabel} right now.
      </p>
    );
  }

  return (
    <div className="flex h-[min(560px,80vh)] flex-col rounded-xl border bg-background shadow-sm">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        {aiAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={aiAvatarUrl} alt={aiName} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold">
            {aiName.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-medium">{aiName}</p>
          <p className="text-muted-foreground text-xs">{businessLabel}</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              message.role === "user"
                ? "bg-primary text-primary-foreground ml-auto"
                : "bg-muted"
            }`}
          >
            {message.content}
          </div>
        ))}

        {pendingConfirmations.map((item) => (
          <div key={item.actionId} className="bg-amber-50 border-amber-200 max-w-[90%] rounded-lg border p-3 text-sm">
            <p className="mb-2 font-medium">Confirm action</p>
            <p className="text-muted-foreground mb-3 text-xs">{item.description}</p>
            <div className="flex gap-2">
              <Button size="sm" disabled={loading} onClick={() => void handleConfirm(item.actionId)}>
                Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() => handleCancelConfirmation(item.actionId)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ))}

        {showVerification && requiresVerification && onVerify ? (
          <div className="bg-muted/50 max-w-[90%] space-y-2 rounded-lg border p-3 text-sm">
            <p className="font-medium">Verify your identity</p>
            <p className="text-muted-foreground text-xs">
              Enter your email, phone, or order reference to look up orders securely.
            </p>
            <input
              type="email"
              value={verifyEmail}
              onChange={(e) => setVerifyEmail(e.target.value)}
              placeholder="Email"
              className="bg-background w-full rounded-md border px-2 py-1.5 text-sm"
              disabled={loading}
            />
            <input
              type="tel"
              value={verifyPhone}
              onChange={(e) => setVerifyPhone(e.target.value)}
              placeholder="Phone"
              className="bg-background w-full rounded-md border px-2 py-1.5 text-sm"
              disabled={loading}
            />
            <input
              type="text"
              value={verifyOrderRef}
              onChange={(e) => setVerifyOrderRef(e.target.value)}
              placeholder="Order reference (optional)"
              className="bg-background w-full rounded-md border px-2 py-1.5 text-sm"
              disabled={loading}
            />
            <Button size="sm" disabled={loading} onClick={() => void handleVerify()}>
              Verify
            </Button>
          </div>
        ) : null}

        {loading ? <p className="text-muted-foreground text-sm">Thinking…</p> : null}
        <div ref={bottomRef} />
      </div>

      {error ? <p className="text-destructive px-4 text-xs">{error}</p> : null}

      <div className="flex gap-2 border-t p-3">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void sendMessage(input);
          }}
          placeholder="Ask a question…"
          className="bg-background flex-1 rounded-md border px-3 py-2 text-sm"
          disabled={loading}
        />
        <Button disabled={loading || !input.trim()} onClick={() => void sendMessage(input)}>
          Send
        </Button>
      </div>
    </div>
  );
}
