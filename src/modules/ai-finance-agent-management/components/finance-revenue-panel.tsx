"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceAgentNav } from "@/modules/ai-finance-agent-management/components/finance-agent-nav";
import type { RevenueSnapshot } from "@/services/ai-finance-revenue-analysis.service";

interface FinanceRevenuePanelProps {
  revenue: RevenueSnapshot;
}

export function FinanceRevenuePanel({ revenue }: FinanceRevenuePanelProps) {
  return (
    <div className="space-y-8">
      <FinanceAgentNav />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly gross</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              £{(revenue.grossRevenueMonthPence / 100).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              £{(revenue.revenueTodayPence / 100).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">£{(revenue.revenueWeekPence / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Collected (RevOps)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              £{(revenue.totalCollectedPence / 100).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>{revenue.totalOrders} orders this month</p>
          <p className="text-muted-foreground mt-2">
            Invoiced: £{(revenue.totalInvoicedPence / 100).toFixed(2)} · Discounts: £
            {(revenue.discountPence / 100).toFixed(2)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
