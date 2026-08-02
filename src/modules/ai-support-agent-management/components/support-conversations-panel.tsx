"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupportAgentNav } from "@/modules/ai-support-agent-management/components/support-agent-nav";
import { AI_SUPPORT_AGENT_ROUTES } from "@/modules/ai-support-agent-management/constants/routes";
import type { ConversationSummary } from "@/services/ai-support-conversation-analysis.service";
import type { TicketSnapshot } from "@/services/ai-support-ticket-analysis.service";

interface SupportConversationsPanelProps {
  summaries: ConversationSummary[];
  tickets: TicketSnapshot[];
  messages: Array<{
    id: string;
    messageType: string;
    senderType: string;
    body: string;
    createdAt: Date;
    isInternal: boolean;
  }>;
  selectedTicketId: string | null;
}

export function SupportConversationsPanel({
  summaries,
  tickets,
  messages,
  selectedTicketId,
}: SupportConversationsPanelProps) {
  return (
    <div className="space-y-8">
      <SupportAgentNav />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {tickets.map((ticket) => (
                <li key={ticket.id} className="rounded-lg border p-3">
                  <Link
                    href={`${AI_SUPPORT_AGENT_ROUTES.conversations()}?ticket=${ticket.id}`}
                    className="hover:text-primary font-medium"
                  >
                    {ticket.subject ?? "No subject"}
                  </Link>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {ticket.customerName ?? "Unknown"} · {ticket.status} · {ticket.messageCount}{" "}
                    messages
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedTicketId ? "Conversation viewer" : "Conversation summaries"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTicketId && messages.length > 0 ? (
              <ul className="space-y-3">
                {messages.map((message) => (
                  <li key={message.id} className="rounded border p-3 text-sm">
                    <p className="text-muted-foreground text-xs capitalize">
                      {message.senderType} · {message.messageType}
                    </p>
                    <p className="mt-1">{message.body}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-3">
                {summaries.map((summary) => (
                  <li key={summary.ticketId} className="rounded-lg border p-3">
                    <p className="font-medium">{summary.subject ?? "Support request"}</p>
                    <p className="text-muted-foreground mt-1 text-sm">{summary.summary}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Intents: {summary.intents.join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
