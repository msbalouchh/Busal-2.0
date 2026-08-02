"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HrAgentNav } from "@/modules/ai-hr-agent-management/components/hr-agent-nav";
import type { PerformanceSnapshot } from "@/services/ai-hr-performance-analysis.service";

interface HrPerformancePanelProps {
  performance: PerformanceSnapshot;
}

export function HrPerformancePanel({ performance }: HrPerformancePanelProps) {
  return (
    <div className="space-y-8">
      <HrAgentNav />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active staff</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{performance.totalActiveStaff}</p>
            <p className="text-muted-foreground text-xs">
              Avg {performance.avgOrdersPerStaff} orders per staff
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top performers</CardTitle>
          </CardHeader>
          <CardContent>
            {performance.topPerformers.length === 0 ? (
              <p className="text-muted-foreground text-sm">No performance data yet.</p>
            ) : (
              <ul className="space-y-2">
                {performance.topPerformers.map((performer) => (
                  <li key={performer.staffId} className="text-sm">
                    <p className="font-medium">{performer.name}</p>
                    <p className="text-muted-foreground">
                      {performer.ordersHandled} orders · £
                      {(performer.revenuePence / 100).toFixed(2)} revenue
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coaching opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            {performance.lowPerformers.length === 0 ? (
              <p className="text-muted-foreground text-sm">No low performers detected.</p>
            ) : (
              <ul className="space-y-2">
                {performance.lowPerformers.map((performer) => (
                  <li key={performer.staffId} className="text-sm">
                    <p className="font-medium">{performer.name}</p>
                    <p className="text-muted-foreground">
                      {performer.ordersHandled} orders handled
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
