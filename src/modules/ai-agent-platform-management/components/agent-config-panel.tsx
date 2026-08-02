"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createPlatformAgentAction,
  updateAgentConfigurationAction,
  updatePlatformAgentAction,
} from "@/modules/ai-agent-platform-management/actions/ai-agent-platform-actions";
import { AgentPlatformNav } from "@/modules/ai-agent-platform-management/components/agent-platform-nav";
import {
  AGENT_CATEGORY_OPTIONS,
  AGENT_STATUS_OPTIONS,
  AI_AGENT_PLATFORM_ROUTES,
} from "@/modules/ai-agent-platform-management/constants/routes";
import type { AiAgentPlatformContext } from "@/modules/ai-agent-platform-management/lib/get-ai-agent-platform-context";
import type { PlatformAgentRecord } from "@/modules/ai-agent-platform-management/types/ai-agent-platform-types";
import type { AgentCategory, AgentStatus } from "@prisma/client";

interface AgentConfigPanelProps {
  context: AiAgentPlatformContext;
  agent?: PlatformAgentRecord;
}

export function AgentConfigPanel({ context: _context, agent }: AgentConfigPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(agent?.name ?? "");
  const [slug, setSlug] = useState(agent?.slug ?? "");
  const [description, setDescription] = useState(agent?.description ?? "");
  const [category, setCategory] = useState<AgentCategory>(agent?.category ?? "CUSTOM");
  const [status, setStatus] = useState<AgentStatus>(agent?.status ?? "DRAFT");
  const [configJson, setConfigJson] = useState(JSON.stringify(agent?.configuration ?? {}, null, 2));

  const handleSubmit = () => {
    startTransition(async () => {
      let configuration: Record<string, unknown> = {};
      try {
        configuration = JSON.parse(configJson) as Record<string, unknown>;
      } catch {
        return;
      }

      if (agent) {
        await updatePlatformAgentAction(agent.id, {
          name,
          slug,
          description: description || null,
          category,
          status,
        });
        await updateAgentConfigurationAction(agent.id, configuration);
        router.push(AI_AGENT_PLATFORM_ROUTES.agent(agent.id));
      } else {
        const created = await createPlatformAgentAction({
          name,
          slug: slug || undefined,
          description: description || null,
          category,
          status,
          configuration,
        });
        router.push(AI_AGENT_PLATFORM_ROUTES.agent(created.id));
      }
    });
  };

  return (
    <div className="space-y-6">
      <AgentPlatformNav />
      <Card>
        <CardHeader>
          <CardTitle>{agent ? "Edit agent" : "Create agent"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-name">Name</Label>
            <Input id="agent-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-slug">Slug</Label>
            <Input id="agent-slug" value={slug} onChange={(event) => setSlug(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-description">Description</Label>
            <Input
              id="agent-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="agent-category">Category</Label>
              <select
                id="agent-category"
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                value={category}
                onChange={(event) => setCategory(event.target.value as AgentCategory)}
              >
                {AGENT_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-status">Status</Label>
              <select
                id="agent-status"
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value as AgentStatus)}
              >
                {AGENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-config">Configuration (JSON)</Label>
            <textarea
              id="agent-config"
              className="border-input bg-background min-h-40 w-full rounded-md border px-3 py-2 font-mono text-sm"
              value={configJson}
              onChange={(event) => setConfigJson(event.target.value)}
            />
          </div>
          <Button type="button" disabled={isPending || !name.trim()} onClick={handleSubmit}>
            {agent ? "Save changes" : "Create agent"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
