"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupportAgentNav } from "@/modules/ai-support-agent-management/components/support-agent-nav";
import type { EscalationAlert } from "@/services/ai-support-escalation-detection.service";

interface SupportEscalationsPanelProps {
  escalations: EscalationAlert[];
}

export function SupportEscalationsPanel({ escalations }: SupportEscalationsPanelProps) {
  return (
    <div className="space-y-8">
      <SupportAgentNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Escalation center ({escalations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {escalations.length === 0 ? (
            <p className="text-muted-foreground text-sm">No escalations detected.</p>
          ) : (
            <ul className="space-y-4">
              {escalations.map((alert) => (
                <li key={alert.ticketId} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{alert.subject ?? "Ticket"}</p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {alert.customerName ?? "Unknown customer"} · waiting {alert.waitingHours}h
                      </p>
                      <p className="mt-2 text-sm">{alert.reason}</p>
                    </div>
                    <Badge variant={alert.priority === "CRITICAL" ? "destructive" : "secondary"}>
                      {alert.priority}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
