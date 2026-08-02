"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HrAgentNav } from "@/modules/ai-hr-agent-management/components/hr-agent-nav";
import { AI_HR_AGENT_ROUTES } from "@/modules/ai-hr-agent-management/constants/routes";
import type {
  HrInsightRecord,
  HrRecommendationRecord,
} from "@/modules/ai-hr-agent-management/types/ai-hr-agent-types";

interface HrSearchPanelProps {
  search: string;
  results: { insights: HrInsightRecord[]; recommendations: HrRecommendationRecord[] };
}

export function HrSearchPanel({ search, results }: HrSearchPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState(search);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <HrAgentNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search HR content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(() => {
                const params = new URLSearchParams();
                if (query.trim()) params.set("q", query.trim());
                router.push(`${AI_HR_AGENT_ROUTES.search()}?${params.toString()}`);
              });
            }}
          >
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search insights and recommendations…"
              className="max-w-md"
              aria-label="Search HR content"
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
