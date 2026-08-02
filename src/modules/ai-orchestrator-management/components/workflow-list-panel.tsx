"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OrchestratorNav } from "@/modules/ai-orchestrator-management/components/orchestrator-nav";
import {
  AI_ORCHESTRATOR_ROUTES,
  WORKFLOW_STATUS_OPTIONS,
} from "@/modules/ai-orchestrator-management/constants/routes";
import type { AiOrchestratorContext } from "@/modules/ai-orchestrator-management/lib/get-ai-orchestrator-context";
import type { WorkflowListResult } from "@/modules/ai-orchestrator-management/types/ai-orchestrator-types";

interface WorkflowListPanelProps {
  context: AiOrchestratorContext;
  list: WorkflowListResult;
}

export function WorkflowListPanel({ list }: WorkflowListPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);
    startTransition(() => {
      router.push(`${AI_ORCHESTRATOR_ROUTES.list()}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-8">
      <OrchestratorNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workflow List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search workflows"
              aria-label="Search workflows"
            />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="border-input bg-background h-10 rounded-md border px-3 text-sm lg:w-48"
              aria-label="Workflow status"
            >
              {WORKFLOW_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button onClick={applyFilters} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Filter
            </Button>
          </div>

          {list.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">No workflows found.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {list.items.map((workflow) => (
                <li key={workflow.id} className="p-4">
                  <Link
                    href={AI_ORCHESTRATOR_ROUTES.workflow(workflow.id)}
                    className="hover:text-primary font-medium transition-colors"
                  >
                    {workflow.name}
                  </Link>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {workflow.status} · {workflow.stepCount} steps · {workflow.executionCount}{" "}
                    executions
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
