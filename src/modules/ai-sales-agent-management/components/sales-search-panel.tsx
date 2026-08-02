"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SalesAgentNav } from "@/modules/ai-sales-agent-management/components/sales-agent-nav";
import { AI_SALES_AGENT_ROUTES } from "@/modules/ai-sales-agent-management/constants/routes";
import type {
  SalesInsightRecord,
  SalesRecommendationRecord,
} from "@/modules/ai-sales-agent-management/types/ai-sales-agent-types";

interface SalesSearchPanelProps {
  search: string;
  results: { insights: SalesInsightRecord[]; recommendations: SalesRecommendationRecord[] };
}

export function SalesSearchPanel({ search, results }: SalesSearchPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState(search);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <SalesAgentNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search sales insights & recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(() => {
                const params = new URLSearchParams();
                if (query.trim()) params.set("q", query.trim());
                router.push(`${AI_SALES_AGENT_ROUTES.search()}?${params.toString()}`);
              });
            }}
          >
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search insights, recommendations, actions…"
              className="max-w-md"
              aria-label="Search sales content"
            />
            <Button type="submit" disabled={isPending}>
              Search
            </Button>
          </form>

          {search ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-3 text-sm font-medium">Insights ({results.insights.length})</p>
                {results.insights.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No matching insights.</p>
                ) : (
                  <ul className="space-y-2">
                    {results.insights.map((insight) => (
                      <li key={insight.id} className="rounded border p-3 text-sm">
                        <p className="font-medium">{insight.title}</p>
                        <p className="text-muted-foreground mt-1">{insight.description}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-3 text-sm font-medium">
                  Recommendations ({results.recommendations.length})
                </p>
                {results.recommendations.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No matching recommendations.</p>
                ) : (
                  <ul className="space-y-2">
                    {results.recommendations.map((item) => (
                      <li key={item.id} className="rounded border p-3 text-sm">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-muted-foreground mt-1">{item.action}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Enter a search term to find insights and recommendations.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
