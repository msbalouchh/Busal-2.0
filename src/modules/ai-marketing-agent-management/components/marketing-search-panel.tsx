"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MarketingAgentNav } from "@/modules/ai-marketing-agent-management/components/marketing-agent-nav";
import { AI_MARKETING_AGENT_ROUTES } from "@/modules/ai-marketing-agent-management/constants/routes";
import type { MarketingInsightRecord } from "@/modules/ai-marketing-agent-management/types/ai-marketing-agent-types";

interface MarketingSearchPanelProps {
  search: string;
  results: { insights: MarketingInsightRecord[] };
}

export function MarketingSearchPanel({ search, results }: MarketingSearchPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState(search);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <MarketingAgentNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search marketing insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(() => {
                const params = new URLSearchParams();
                if (query.trim()) params.set("q", query.trim());
                router.push(`${AI_MARKETING_AGENT_ROUTES.search()}?${params.toString()}`);
              });
            }}
          >
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search insights, campaigns, promotions…"
              className="max-w-md"
              aria-label="Search marketing content"
            />
            <Button type="submit" disabled={isPending}>
              Search
            </Button>
          </form>

          {search ? (
            <div>
              <p className="mb-3 text-sm font-medium">Results ({results.insights.length})</p>
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
          ) : (
            <p className="text-muted-foreground text-sm">
              Enter a search term to find marketing insights.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
