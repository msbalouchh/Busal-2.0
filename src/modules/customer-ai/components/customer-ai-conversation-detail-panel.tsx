"use client";

import Link from "next/link";
import { useTransition } from "react";

import { AI_PLATFORM_ROUTES } from "@/modules/ai-platform/constants/ai-platform";
import { escalateConversationAction } from "@/modules/customer-ai/actions/customer-ai-actions";
import { CUSTOMER_AI_ROUTES } from "@/modules/customer-ai/constants/customer-ai.constants";

interface CustomerAiConversationDetailPanelProps {
  conversation: {
    id: string;
    title: string;
    channel: string;
    customerName: string | null;
    escalated: boolean;
    messages: Array<{ id: string; role: string; content: string; createdAt: string }>;
  };
  canManage: boolean;
}

export function CustomerAiConversationDetailPanel({
  conversation,
  canManage,
}: CustomerAiConversationDetailPanelProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{conversation.title}</h1>
          <p className="text-muted-foreground text-sm">
            {conversation.customerName ?? "Guest"} · {conversation.channel}
            {conversation.escalated ? " · Escalated" : ""}
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href={CUSTOMER_AI_ROUTES.conversations} className="underline">
            All conversations
          </Link>
          <Link href={AI_PLATFORM_ROUTES.controlCenter} className="underline">
            Control Center
          </Link>
        </div>
      </div>

      {canManage && !conversation.escalated ? (
        <button
          type="button"
          className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await escalateConversationAction(conversation.id);
            })
          }
        >
          Escalate to team
        </button>
      ) : null}

      <div className="space-y-3 rounded-xl border p-4">
        {conversation.messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-lg px-3 py-2 text-sm ${
              message.role === "USER"
                ? "bg-primary text-primary-foreground ml-8"
                : "bg-muted mr-8"
            }`}
          >
            <p className="text-muted-foreground mb-1 text-[10px] uppercase">
              {message.role} · {new Date(message.createdAt).toLocaleString()}
            </p>
            {message.content}
          </div>
        ))}
      </div>
    </div>
  );
}
