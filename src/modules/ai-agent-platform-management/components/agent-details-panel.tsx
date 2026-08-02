"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Play, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  deletePlatformAgentAction,
  executePlatformAgentAction,
} from "@/modules/ai-agent-platform-management/actions/ai-agent-platform-actions";
import { AgentPlatformNav } from "@/modules/ai-agent-platform-management/components/agent-platform-nav";
import { AI_AGENT_PLATFORM_ROUTES } from "@/modules/ai-agent-platform-management/constants/routes";
import type { AiAgentPlatformContext } from "@/modules/ai-agent-platform-management/lib/get-ai-agent-platform-context";
import type {
  PlatformAgentCapabilityRecord,
  PlatformAgentExecutionRecord,
  PlatformAgentRecord,
  PlatformAgentToolRecord,
} from "@/modules/ai-agent-platform-management/types/ai-agent-platform-types";

interface AgentDetailsPanelProps {
  context: AiAgentPlatformContext;
  agent: PlatformAgentRecord;
  tools: PlatformAgentToolRecord[];
  capabilities: PlatformAgentCapabilityRecord[];
  executions: PlatformAgentExecutionRecord[];
}

export function AgentDetailsPanel({
  context,
  agent,
  tools,
  capabilities,
  executions,
}: AgentDetailsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastOutput, setLastOutput] = useState<string | null>(null);

  const handleExecute = () => {
    startTransition(async () => {
      const result = await executePlatformAgentAction({
        agentId: agent.id,
        input: { prompt: "Platform health check" },
      });
      setLastOutput(JSON.stringify(result.output, null, 2));
      router.refresh();
    });
  };

  const handleArchive = () => {
    if (!window.confirm("Archive this agent?")) return;
    startTransition(async () => {
      await deletePlatformAgentAction(agent.id);
      router.push(AI_AGENT_PLATFORM_ROUTES.dashboard());
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{agent.name}</h2>
          <p className="text-muted-foreground text-sm">
            {agent.slug} · {agent.category} · {agent.status} · v{agent.version}
          </p>
          {agent.description ? (
            <p className="text-muted-foreground mt-2 text-sm">{agent.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {context.permissionsFlags.canExecute && agent.status === "ACTIVE" ? (
            <Button type="button" disabled={isPending} onClick={handleExecute}>
              <Play className="mr-2 h-4 w-4" />
              Execute
            </Button>
          ) : null}
          {context.permissionsFlags.canUpdate ? (
            <Button type="button" variant="outline" asChild>
              <Link href={AI_AGENT_PLATFORM_ROUTES.agentConfig(agent.id)}>Configure</Link>
            </Button>
          ) : null}
          {context.permissionsFlags.canDelete ? (
            <Button type="button" variant="ghost" disabled={isPending} onClick={handleArchive}>
              <Trash2 className="mr-2 h-4 w-4" />
              Archive
            </Button>
          ) : null}
        </div>
      </div>

      <AgentPlatformNav />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Capabilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {capabilities.length === 0 ? (
              <p className="text-muted-foreground">No capabilities assigned.</p>
            ) : (
              capabilities.map((capability) => (
                <div key={capability.id} className="flex justify-between gap-2">
                  <span>{capability.name}</span>
                  <span className="text-muted-foreground">
                    {capability.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {tools.length === 0 ? (
              <p className="text-muted-foreground">No tools assigned.</p>
            ) : (
              tools.map((tool) => (
                <div key={tool.id} className="flex justify-between gap-2">
                  <span>
                    {tool.name} ({tool.toolKey})
                  </span>
                  <span className="text-muted-foreground">
                    {tool.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {lastOutput ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Last execution output</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">{lastOutput}</pre>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Execution history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {executions.length === 0 ? (
            <p className="text-muted-foreground">No executions yet.</p>
          ) : (
            executions.map((execution) => (
              <div key={execution.id} className="border-b pb-2 last:border-0">
                <p>
                  {execution.status} · {execution.duration ?? 0}ms
                </p>
                {execution.error ? (
                  <p className="text-destructive text-xs">{execution.error}</p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
