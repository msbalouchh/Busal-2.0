"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupportAgentNav } from "@/modules/ai-support-agent-management/components/support-agent-nav";
import type { SatisfactionSnapshot } from "@/services/ai-support-satisfaction.service";
import type { TicketAnalysisSnapshot } from "@/services/ai-support-ticket-analysis.service";

interface SupportAnalyticsPanelProps {
  satisfaction: SatisfactionSnapshot;
  tickets: TicketAnalysisSnapshot;
  dissatisfied: Array<{
    ticketId: string;
    customerName: string | null;
    subject: string | null;
    preview: string;
  }>;
}

export function SupportAnalyticsPanel({
  satisfaction,
  tickets,
  dissatisfied,
}: SupportAnalyticsPanelProps) {
  return (
    <div className="space-y-8">
      <SupportAgentNav />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{satisfaction.satisfactionScore}</p>
            <p className="text-muted-foreground text-xs">{satisfaction.satisfactionLabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg response time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{satisfaction.avgResponseTimeHours}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{satisfaction.closedTickets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Complaint rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{satisfaction.complaintRatePercent}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resolution analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {tickets.unresolvedCount} unresolved · {tickets.urgentCount} urgent ·{" "}
              {tickets.waitingStaff} waiting for staff
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dissatisfied customers</CardTitle>
          </CardHeader>
          <CardContent>
            {dissatisfied.length === 0 ? (
              <p className="text-muted-foreground text-sm">None detected recently.</p>
            ) : (
              <ul className="space-y-2">
                {dissatisfied.map((item) => (
                  <li key={item.ticketId} className="text-sm">
                    <p className="font-medium">{item.customerName ?? "Unknown"}</p>
                    <p className="text-muted-foreground">{item.preview}</p>
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
