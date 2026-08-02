"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SupportAgentNav } from "@/modules/ai-support-agent-management/components/support-agent-nav";
import { AI_SUPPORT_AGENT_ROUTES } from "@/modules/ai-support-agent-management/constants/routes";
import type {
  SupportInsightRecord,
  SupportRecommendationRecord,
} from "@/modules/ai-support-agent-management/types/ai-support-agent-types";

interface SupportSearchPanelProps {
  search: string;
  results: { insights: SupportInsightRecord[]; recommendations: SupportRecommendationRecord[] };
}

export function SupportSearchPanel({ search, results }: SupportSearchPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState(search);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <SupportAgentNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search support content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(() => {
                const params = new URLSearchParams();
                if (query.trim()) params.set("q", query.trim());
                router.push(`${AI_SUPPORT_AGENT_ROUTES.search()}?${params.toString()}`);
              });
            }}
          >
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search insights and recommendations…"
              className="max-w-md"
              aria-label="Search support content"
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
