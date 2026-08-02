"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPence } from "@/modules/ai-sales-agent-management/lib/ai-sales-agent-validation";
import { SalesAgentNav } from "@/modules/ai-sales-agent-management/components/sales-agent-nav";
import type { SalesOpportunityItem } from "@/services/ai-sales-opportunity-detection.service";

interface SalesOpportunitiesPanelProps {
  opportunities: SalesOpportunityItem[];
  pipeline: Array<{
    id: string;
    name: string;
    valuePence: number;
    stage: { name: string; probabilityBps: number };
    company: { name: string } | null;
  }>;
  followUps: {
    tasks: Array<{ id: string; title: string; dueAt: Date | null; status: string }>;
    demos: Array<{ id: string; scheduledAt: Date; status: string }>;
    contacts: Array<{ id: string; name: string; lastOrderAt: Date | null; totalSpend: unknown }>;
  };
}

export function SalesOpportunitiesPanel({
  opportunities,
  pipeline,
  followUps,
}: SalesOpportunitiesPanelProps) {
  return (
    <div className="space-y-8">
      <SalesAgentNav />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detected opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            {opportunities.length === 0 ? (
              <p className="text-muted-foreground text-sm">No opportunities detected.</p>
            ) : (
              <ul className="space-y-3">
                {opportunities.map((item) => (
                  <li key={`${item.type}-${item.id}`} className="rounded-lg border p-3">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
                    <p className="mt-2 text-sm">{item.action}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {pipeline.length === 0 ? (
              <p className="text-muted-foreground text-sm">No open opportunities in pipeline.</p>
            ) : (
              <ul className="space-y-3">
                {pipeline.map((item) => (
                  <li key={item.id} className="rounded-lg border p-3">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {item.company?.name ?? "No company"} · {item.stage.name} ·{" "}
                      {formatPence(item.valuePence)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Follow-up suggestions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div>
            <p className="mb-2 text-sm font-medium">Pending tasks</p>
            {followUps.tasks.length === 0 ? (
              <p className="text-muted-foreground text-sm">None</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {followUps.tasks.map((task) => (
                  <li key={task.id}>{task.title}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Upcoming demos</p>
            {followUps.demos.length === 0 ? (
              <p className="text-muted-foreground text-sm">None</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {followUps.demos.map((demo) => (
                  <li key={demo.id}>{new Date(demo.scheduledAt).toLocaleDateString()}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Customers to contact</p>
            {followUps.contacts.length === 0 ? (
              <p className="text-muted-foreground text-sm">None</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {followUps.contacts.map((contact) => (
                  <li key={contact.id}>{contact.name}</li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
