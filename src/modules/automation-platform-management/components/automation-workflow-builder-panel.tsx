"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAutomationWorkflowAction } from "@/modules/automation-platform-management/actions/automation-platform-actions";
import { AutomationPlatformNav } from "@/modules/automation-platform-management/components/automation-platform-nav";
import {
  AUTOMATION_PLATFORM_ROUTES,
  TRIGGER_TYPE_OPTIONS,
} from "@/modules/automation-platform-management/constants/routes";
import type { AutomationPlatformContext } from "@/modules/automation-platform-management/lib/get-automation-platform-context";

interface AutomationWorkflowBuilderPanelProps {
  context: AutomationPlatformContext;
}

export function AutomationWorkflowBuilderPanel({ context }: AutomationWorkflowBuilderPanelProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] =
    useState<(typeof TRIGGER_TYPE_OPTIONS)[number]["value"]>("EVENT");
  const [isPending, startTransition] = useTransition();

  if (!context.permissionsFlags.canCreate) {
    return (
      <div className="space-y-8">
        <AutomationPlatformNav />
        <p className="text-muted-foreground text-sm">
          You do not have permission to create workflows.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AutomationPlatformNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid max-w-xl gap-4"
            onSubmit={(formEvent) => {
              formEvent.preventDefault();
              startTransition(async () => {
                const result = await createAutomationWorkflowAction({
                  name,
                  description,
                  triggerType,
                });
                router.push(AUTOMATION_PLATFORM_ROUTES.workflowDetail(result.id));
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="workflow-name">Name</Label>
              <Input
                id="workflow-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workflow-description">Description</Label>
              <Input
                id="workflow-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workflow-trigger-type">Trigger type</Label>
              <select
                id="workflow-trigger-type"
                value={triggerType}
                onChange={(event) =>
                  setTriggerType(
                    event.target.value as (typeof TRIGGER_TYPE_OPTIONS)[number]["value"],
                  )
                }
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              >
                {TRIGGER_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={isPending}>
              Create workflow
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
