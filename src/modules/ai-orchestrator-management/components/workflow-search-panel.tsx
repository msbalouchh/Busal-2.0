"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OrchestratorNav } from "@/modules/ai-orchestrator-management/components/orchestrator-nav";
import { AI_ORCHESTRATOR_ROUTES } from "@/modules/ai-orchestrator-management/constants/routes";
import type { AiOrchestratorContext } from "@/modules/ai-orchestrator-management/lib/get-ai-orchestrator-context";
import type {
  WorkflowListQuery,
  WorkflowListResult,
} from "@/modules/ai-orchestrator-management/types/ai-orchestrator-types";

interface WorkflowSearchPanelProps {
  context: AiOrchestratorContext;
  results: WorkflowListResult;
  query: WorkflowListQuery;
}

export function WorkflowSearchPanel({ results, query }: WorkflowSearchPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(query.search ?? "");

  const runSearch = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    startTransition(() => {
      router.push(`${AI_ORCHESTRATOR_ROUTES.search()}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-8">
      <OrchestratorNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workflow Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search workflows"
              aria-label="Search workflows"
            />
            <Button onClick={runSearch} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
          </div>

          {results.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">No workflows matched your search.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {results.items.map((workflow) => (
                <li key={workflow.id} className="p-4">
                  <Link
                    href={AI_ORCHESTRATOR_ROUTES.workflow(workflow.id)}
                    className="hover:text-primary font-medium transition-colors"
                  >
                    {workflow.name}
                  </Link>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {workflow.status} · {workflow.stepCount} steps
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
