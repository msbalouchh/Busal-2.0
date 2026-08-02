"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OperationsAgentNav } from "@/modules/ai-operations-agent-management/components/operations-agent-nav";
import { AI_OPERATIONS_AGENT_ROUTES } from "@/modules/ai-operations-agent-management/constants/routes";
import type {
  OperationInsightRecord,
  OperationRecommendationRecord,
} from "@/modules/ai-operations-agent-management/types/ai-operations-agent-types";

interface OperationsSearchPanelProps {
  search: string;
  results: { insights: OperationInsightRecord[]; recommendations: OperationRecommendationRecord[] };
}

export function OperationsSearchPanel({ search, results }: OperationsSearchPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState(search);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <OperationsAgentNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search operational content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(() => {
                const params = new URLSearchParams();
                if (query.trim()) params.set("q", query.trim());
                router.push(`${AI_OPERATIONS_AGENT_ROUTES.search()}?${params.toString()}`);
              });
            }}
          >
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search insights and recommendations…"
              className="max-w-md"
              aria-label="Search operational content"
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
                  <p className="text-muted-foreground text-sm">No matches.</p>
                ) : (
                  <ul className="space-y-2">
                    {results.insights.map((item) => (
                      <li key={item.id} className="rounded border p-3 text-sm">
                        <p className="font-medium">{item.title}</p>
                        {item.description ? (
                          <p className="text-muted-foreground mt-1">{item.description}</p>
                        ) : null}
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
                  <p className="text-muted-foreground text-sm">No matches.</p>
                ) : (
                  <ul className="space-y-2">
                    {results.recommendations.map((item) => (
                      <li key={item.id} className="rounded border p-3 text-sm">
                        <p className="font-medium">{item.title}</p>
                        {item.action ? (
                          <p className="text-muted-foreground mt-1">{item.action}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Enter a search term.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
