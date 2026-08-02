"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceAgentNav } from "@/modules/ai-finance-agent-management/components/finance-agent-nav";
import type { CashFlowSnapshot } from "@/services/ai-finance-cash-flow.service";
import type { FinancialForecastFramework } from "@/services/ai-finance-forecast.service";

interface FinanceCashFlowPanelProps {
  cashFlow: CashFlowSnapshot;
  forecast: FinancialForecastFramework;
}

export function FinanceCashFlowPanel({ cashFlow, forecast }: FinanceCashFlowPanelProps) {
  return (
    <div className="space-y-8">
      <FinanceAgentNav />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net cash flow</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              £{(cashFlow.netCashFlowPence / 100).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              £{(cashFlow.totalCollectedPence / 100).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              £{(cashFlow.outstandingPence / 100).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{cashFlow.overdueInvoices}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue forecast (framework)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">{forecast.methodology}</p>
          {forecast.points.length === 0 ? (
            <p className="text-sm">No forecast data available.</p>
          ) : (
            <ul className="space-y-2">
              {forecast.points.slice(0, 6).map((point) => (
                <li key={point.month} className="flex justify-between text-sm">
                  <span>{point.month}</span>
                  <span>
                    £{(point.projectedRevenuePence / 100).toFixed(2)} ({point.source})
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-muted-foreground text-xs">{forecast.disclaimer}</p>
        </CardContent>
      </Card>
    </div>
  );
}
