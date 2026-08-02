"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/modules/ai-marketing-agent-management/lib/ai-marketing-agent-validation";
import { MarketingAgentNav } from "@/modules/ai-marketing-agent-management/components/marketing-agent-nav";
import type { AudienceSnapshot } from "@/services/ai-marketing-audience-analysis.service";

interface MarketingAudiencePanelProps {
  audience: AudienceSnapshot;
  loyaltyTargets: Array<{
    id: string;
    name: string;
    loyaltyPoints: number;
    lastOrderAt: Date | null;
  }>;
}

export function MarketingAudiencePanel({ audience, loyaltyTargets }: MarketingAudiencePanelProps) {
  return (
    <div className="space-y-8">
      <MarketingAgentNav />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total customers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{audience.totalCustomers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{audience.newCustomers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Returning</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{audience.returningCustomers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatPercent(audience.retentionRatePercent)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Loyalty campaign targets</CardTitle>
        </CardHeader>
        <CardContent>
          {loyaltyTargets.length === 0 ? (
            <p className="text-muted-foreground text-sm">No loyalty targets identified.</p>
          ) : (
            <ul className="space-y-2">
              {loyaltyTargets.map((customer) => (
                <li key={customer.id} className="flex justify-between text-sm">
                  <span>{customer.name}</span>
                  <span className="text-muted-foreground">{customer.loyaltyPoints} points</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
