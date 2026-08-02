"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceAgentNav } from "@/modules/ai-finance-agent-management/components/finance-agent-nav";
import type { ProfitabilitySnapshot } from "@/services/ai-finance-profitability.service";

interface FinanceProfitabilityPanelProps {
  profitability: ProfitabilitySnapshot;
}

export function FinanceProfitabilityPanel({ profitability }: FinanceProfitabilityPanelProps) {
  return (
    <div className="space-y-8">
      <FinanceAgentNav />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              £{(profitability.netProfitPence / 100).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{profitability.profitMarginPercent}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              £{(profitability.totalExpensesPence / 100).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top profitable customers</CardTitle>
          </CardHeader>
          <CardContent>
            {profitability.topProfitableCustomers.length === 0 ? (
              <p className="text-muted-foreground text-sm">No profitability data yet.</p>
            ) : (
              <ul className="space-y-2">
                {profitability.topProfitableCustomers.map((c) => (
                  <li key={c.label} className="text-sm">
                    {c.label} — £{(c.profitPence / 100).toFixed(2)}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unprofitable services</CardTitle>
          </CardHeader>
          <CardContent>
            {profitability.lowMarginServices.length === 0 ? (
              <p className="text-muted-foreground text-sm">No unprofitable services detected.</p>
            ) : (
              <ul className="space-y-2">
                {profitability.lowMarginServices.map((s) => (
                  <li key={s.label} className="text-sm">
                    {s.label} — £{(s.profitPence / 100).toFixed(2)}
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
