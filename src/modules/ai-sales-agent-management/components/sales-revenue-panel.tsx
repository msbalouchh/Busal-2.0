"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPence } from "@/modules/ai-sales-agent-management/lib/ai-sales-agent-validation";
import { SalesAgentNav } from "@/modules/ai-sales-agent-management/components/sales-agent-nav";
import type { SalesForecastResult } from "@/modules/ai-sales-agent-management/types/ai-sales-agent-types";
import type { RevenueInsightSnapshot } from "@/services/ai-sales-revenue-insight.service";
import type { QuoteAnalysisItem } from "@/services/ai-sales-quote-analysis.service";

interface SalesRevenuePanelProps {
  revenue: RevenueInsightSnapshot;
  trend: Array<{ label: string; revenuePence: number; orders: number }>;
  forecast: SalesForecastResult;
  quotes: QuoteAnalysisItem[];
}

export function SalesRevenuePanel({ revenue, trend, forecast, quotes }: SalesRevenuePanelProps) {
  const maxRevenue = Math.max(...trend.map((point) => point.revenuePence), 1);

  return (
    <div className="space-y-8">
      <SalesAgentNav />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatPence(revenue.grossRevenuePence)}</p>
            <p className="text-muted-foreground text-xs">{revenue.totalOrders} orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatPence(revenue.weekRevenuePence)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatPence(revenue.monthRevenuePence)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold capitalize">{revenue.trendDirection}</p>
            <p className="text-muted-foreground text-xs">{revenue.trendPercent}% vs weekly avg</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trend.map((point) => (
              <div key={point.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{point.label}</span>
                  <span>
                    {formatPence(point.revenuePence)} · {point.orders} orders
                  </span>
                </div>
                <div className="bg-muted h-2 rounded-full">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.round((point.revenuePence / maxRevenue) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatPence(forecast.projectedRevenuePence)}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {forecast.horizon} projection · {Math.round(forecast.confidence * 100)}% confidence
            </p>
            <p className="text-muted-foreground mt-2 text-xs">{forecast.methodology}</p>
            <ul className="text-muted-foreground mt-3 list-disc space-y-1 pl-4 text-xs">
              {forecast.assumptions.map((assumption) => (
                <li key={assumption}>{assumption}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quotes likely to close</CardTitle>
          </CardHeader>
          <CardContent>
            {quotes.length === 0 ? (
              <p className="text-muted-foreground text-sm">No high-probability quotes found.</p>
            ) : (
              <ul className="space-y-3">
                {quotes.map((quote) => (
                  <li key={quote.id} className="rounded-lg border p-3">
                    <p className="font-medium">{quote.quoteNumber}</p>
                    <p className="text-muted-foreground mt-1 text-sm">{quote.opportunityTitle}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {quote.status} · {quote.closeProbability}% probability
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
