"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationsAgentNav } from "@/modules/ai-operations-agent-management/components/operations-agent-nav";
import type { WorkflowSnapshot } from "@/services/ai-operations-workflow-analysis.service";

interface OperationsWorkflowsPanelProps {
  workflow: WorkflowSnapshot;
}

export function OperationsWorkflowsPanel({ workflow }: OperationsWorkflowsPanelProps) {
  return (
    <div className="space-y-8">
      <OperationsAgentNav />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{workflow.totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{workflow.pendingOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancelled orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{workflow.cancelledOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Peak hour</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{workflow.peakHour ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orders by status</CardTitle>
        </CardHeader>
        <CardContent>
          {workflow.ordersByStatus.length === 0 ? (
            <p className="text-muted-foreground text-sm">No order data available.</p>
          ) : (
            <ul className="space-y-2">
              {workflow.ordersByStatus.map((row) => (
                <li key={row.status} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{row.status}</span>
                  <span className="text-muted-foreground">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
