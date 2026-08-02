"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceAgentNav } from "@/modules/ai-finance-agent-management/components/finance-agent-nav";
import type { BusinessHealthSnapshot } from "@/services/ai-finance-business-health.service";
import type { FinancialRiskAlert } from "@/services/ai-finance-risk.service";

interface FinanceHealthPanelProps {
  health: BusinessHealthSnapshot;
  risks: FinancialRiskAlert[];
}

export function FinanceHealthPanel({ health, risks }: FinanceHealthPanelProps) {
  return (
    <div className="space-y-8">
      <FinanceAgentNav />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Health score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{health.healthScore}%</p>
            <p className="text-muted-foreground text-xs">{health.healthLabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Profit margin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{health.profitMarginPercent}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net cash flow</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">£{(health.netCashFlowPence / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Budget status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{health.budgetStatus.replace("_", " ")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financial risk alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {risks.length === 0 ? (
            <p className="text-muted-foreground text-sm">No financial risks detected.</p>
          ) : (
            <ul className="space-y-3">
              {risks.map((risk) => (
                <li key={risk.id} className="rounded border p-3 text-sm">
                  <p className="font-medium">
                    {risk.title} <span className="text-muted-foreground">({risk.severity})</span>
                  </p>
                  <p className="text-muted-foreground mt-1">{risk.description}</p>
                  <p className="mt-1">{risk.recommendation}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
