"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bot, Loader2, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AgentPlatformNav } from "@/modules/ai-agent-platform-management/components/agent-platform-nav";
import {
  AGENT_CATEGORY_OPTIONS,
  AGENT_STATUS_OPTIONS,
  AI_AGENT_PLATFORM_ROUTES,
} from "@/modules/ai-agent-platform-management/constants/routes";
import type { AiAgentPlatformContext } from "@/modules/ai-agent-platform-management/lib/get-ai-agent-platform-context";
import type {
  AgentDiscoveryEntry,
  AgentListResult,
  PlatformAgentRecord,
} from "@/modules/ai-agent-platform-management/types/ai-agent-platform-types";

interface AgentPlatformDashboardPanelProps {
  context: AiAgentPlatformContext;
  list: AgentListResult;
  stats: {
    totalAgents: number;
    activeAgents: number;
    draftAgents: number;
    totalExecutions: number;
    failedExecutions: number;
  };
  discovery: AgentDiscoveryEntry[];
}

const STATUS_COLORS: Record<PlatformAgentRecord["status"], string> = {
  ACTIVE: "text-green-600",
  DISABLED: "text-muted-foreground",
  DRAFT: "text-amber-600",
  ARCHIVED: "text-red-600",
};

export function AgentPlatformDashboardPanel({
  context,
  list,
  stats,
  discovery,
}: AgentPlatformDashboardPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const applySearch = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    startTransition(() => {
      router.push(`${AI_AGENT_PLATFORM_ROUTES.dashboard()}?${params.toString()}`);
    });
  };

  const statCards = [
    { label: "Total agents", value: stats.totalAgents },
    { label: "Active", value: stats.activeAgents },
    { label: "Draft", value: stats.draftAgents },
    { label: "Executions", value: stats.totalExecutions },
    { label: "Failed", value: stats.failedExecutions },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">AI Agent Platform</h2>
          <p className="text-muted-foreground text-sm">
            Register, configure, and manage AI agents for your business.
          </p>
        </div>
        {context.permissionsFlags.canCreate ? (
          <Button asChild>
            <Link href={AI_AGENT_PLATFORM_ROUTES.newAgent()}>
              <Plus className="mr-2 h-4 w-4" />
              New agent
            </Link>
          </Button>
        ) : null}
      </div>

      <AgentPlatformNav />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search agents..."
            className="pl-9"
            onKeyDown={(event) => {
              if (event.key === "Enter") applySearch();
            }}
          />
        </div>
        <Button type="button" variant="outline" disabled={isPending} onClick={applySearch}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Search
        </Button>
      </div>

      {list.items.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground flex items-center gap-3 py-10 text-sm">
            <Bot className="h-5 w-5" />
            No agents yet. Create an agent to plug into the platform.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.items.map((agent) => (
            <Card key={agent.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  <Link href={AI_AGENT_PLATFORM_ROUTES.agent(agent.id)} className="hover:underline">
                    {agent.name}
                  </Link>
                </CardTitle>
                <p className="text-muted-foreground text-xs">
                  {agent.slug} · v{agent.version}
                </p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className={STATUS_COLORS[agent.status]}>{agent.status}</p>
                <p className="text-muted-foreground">{agent.category}</p>
                <p>
                  {agent.toolCount ?? 0} tools · {agent.capabilityCount ?? 0} capabilities
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {discovery.length > list.items.length ? (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Discoverable agents</h3>
          <p className="text-muted-foreground text-sm">
            Registered platform agents available to install: {discovery.length}
          </p>
        </section>
      ) : null}

      <section className="space-y-2">
        <h3 className="text-sm font-medium">Filters reference</h3>
        <div className="flex flex-wrap gap-2">
          {AGENT_STATUS_OPTIONS.map((option) => (
            <span key={option.value} className="bg-muted rounded-md px-2 py-1 text-xs">
              {option.label}
            </span>
          ))}
          {AGENT_CATEGORY_OPTIONS.map((option) => (
            <span key={option.value} className="bg-muted rounded-md px-2 py-1 text-xs">
              {option.label}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
