"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatConfidence } from "@/modules/ai-support-agent-management/lib/ai-support-agent-validation";
import { SupportAgentNav } from "@/modules/ai-support-agent-management/components/support-agent-nav";
import { AI_SUPPORT_AGENT_ROUTES } from "@/modules/ai-support-agent-management/constants/routes";
import type { KnowledgeSuggestion } from "@/services/ai-support-knowledge-recommendation.service";
import type { TicketSnapshot } from "@/services/ai-support-ticket-analysis.service";

interface SupportKnowledgePanelProps {
  suggestions: KnowledgeSuggestion[];
  tickets: TicketSnapshot[];
  selectedTicketId: string | null;
}

export function SupportKnowledgePanel({
  suggestions,
  tickets,
  selectedTicketId,
}: SupportKnowledgePanelProps) {
  return (
    <div className="space-y-8">
      <SupportAgentNav />

      {!selectedTicketId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select a ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {tickets.slice(0, 10).map((ticket) => (
                <li key={ticket.id}>
                  <Link
                    href={`${AI_SUPPORT_AGENT_ROUTES.knowledge()}?ticket=${ticket.id}`}
                    className="text-primary text-sm hover:underline"
                  >
                    {ticket.subject ?? ticket.id}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Knowledge suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            {suggestions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No matching knowledge articles.</p>
            ) : (
              <ul className="space-y-3">
                {suggestions.map((item) => (
                  <li key={item.documentId} className="rounded-lg border p-3">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {item.collectionName} · {formatConfidence(item.relevanceScore)} ·{" "}
                      {item.reason}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
