"use client";

import Link from "next/link";
import { useTransition } from "react";

import { AI_PLATFORM_ROUTES } from "@/modules/ai-platform/constants/ai-platform";
import {
  escalateConversationAction,
} from "@/modules/customer-ai/actions/customer-ai-actions";
import { CUSTOMER_AI_ROUTES } from "@/modules/customer-ai/constants/customer-ai.constants";
import type { CustomerConversationSummary } from "@/modules/customer-ai/types/customer-ai.types";

interface CustomerAiConversationsPanelProps {
  conversations: CustomerConversationSummary[];
  canManage: boolean;
}

export function CustomerAiConversationsPanel({
  conversations,
  canManage,
}: CustomerAiConversationsPanelProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Customer AI Conversations</h1>
          <p className="text-muted-foreground text-sm">
            Review customer-facing AI chats and escalate to your team when needed.
          </p>
        </div>
        <Link href={AI_PLATFORM_ROUTES.controlCenter} className="text-sm underline">
          Back to Control Center
        </Link>
      </div>

      {conversations.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border p-6 text-sm">
          No customer AI conversations yet.
        </p>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-sm"
            >
              <div>
                <Link
                  href={`${CUSTOMER_AI_ROUTES.conversations}/${conv.id}`}
                  className="font-medium hover:underline"
                >
                  {conv.title}
                </Link>
                <p className="text-muted-foreground text-xs">
                  {conv.customerName ?? "Guest"} · {conv.channel} · {conv.messageCount} messages
                  {conv.escalated ? " · Escalated" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  {new Date(conv.lastMessageAt).toLocaleString()}
                </span>
                {canManage && !conv.escalated ? (
                  <button
                    type="button"
                    className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        await escalateConversationAction(conv.id);
                      })
                    }
                  >
                    Escalate
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
