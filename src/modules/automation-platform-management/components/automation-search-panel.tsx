"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AutomationPlatformNav } from "@/modules/automation-platform-management/components/automation-platform-nav";
import { AUTOMATION_PLATFORM_ROUTES } from "@/modules/automation-platform-management/constants/routes";
import type {
  AutomationExecutionRecord,
  AutomationWorkflowRecord,
} from "@/modules/automation-platform-management/types/automation-platform-types";

interface AutomationSearchPanelProps {
  search: string;
  results: {
    workflows: AutomationWorkflowRecord[];
    executions: AutomationExecutionRecord[];
  };
}

function AutomationSearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex max-w-xl gap-2"
      onSubmit={(formEvent) => {
        formEvent.preventDefault();
        startTransition(() => {
          router.push(
            `${AUTOMATION_PLATFORM_ROUTES.search()}?q=${encodeURIComponent(query.trim())}`,
          );
        });
      }}
    >
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search workflows and executions..."
      />
      <Button type="submit" disabled={isPending}>
        Search
      </Button>
    </form>
  );
}

export function AutomationSearchPanel({ search, results }: AutomationSearchPanelProps) {
  return (
    <div className="space-y-8">
      <AutomationPlatformNav />

      <Suspense fallback={<div className="bg-muted h-10 max-w-xl animate-pulse rounded" />}>
        <AutomationSearchForm />
      </Suspense>

      {search ? (
        <p className="text-muted-foreground text-sm">Results for &quot;{search}&quot;</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workflows ({results.workflows.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {results.workflows.length === 0 ? (
              <p className="text-muted-foreground text-sm">No matching workflows.</p>
            ) : (
              <ul className="space-y-2">
                {results.workflows.map((workflow) => (
                  <li key={workflow.id}>
                    <Link
                      href={AUTOMATION_PLATFORM_ROUTES.workflowDetail(workflow.id)}
                      className="font-medium hover:underline"
                    >
                      {workflow.name}
                    </Link>
                    <Badge className="ml-2" variant="secondary">
                      {workflow.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Executions ({results.executions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {results.executions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No matching executions.</p>
            ) : (
              <ul className="space-y-2">
                {results.executions.map((execution) => (
                  <li key={execution.id} className="text-sm">
                    <span className="font-medium">{execution.workflowName}</span>
                    <Badge className="ml-2" variant="outline">
                      {execution.status}
                    </Badge>
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
