"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  executeAutomationWorkflowAction,
  saveWorkflowBuilderAction,
} from "@/modules/automation-platform-management/actions/automation-platform-actions";
import { AutomationPlatformNav } from "@/modules/automation-platform-management/components/automation-platform-nav";
import type { AutomationPlatformContext } from "@/modules/automation-platform-management/lib/get-automation-platform-context";
import type { AutomationWorkflowDetailRecord } from "@/modules/automation-platform-management/types/automation-platform-types";

interface AutomationWorkflowDetailPanelProps {
  context: AutomationPlatformContext;
  workflow: AutomationWorkflowDetailRecord;
}

export function AutomationWorkflowDetailPanel({
  context,
  workflow,
}: AutomationWorkflowDetailPanelProps) {
  const [triggerEvent, setTriggerEvent] = useState(workflow.triggers[0]?.event ?? "manual.event");
  const [actionType, setActionType] = useState(workflow.actions[0]?.type ?? "notify.staff");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <AutomationPlatformNav />

      <div>
        <h2 className="text-xl font-semibold">{workflow.name}</h2>
        <p className="text-muted-foreground text-sm">{workflow.description || "No description"}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge>{workflow.status}</Badge>
          <Badge variant="outline">{workflow.triggerType}</Badge>
          <Badge variant="outline">{workflow.enabled ? "Enabled" : "Disabled"}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Triggers ({workflow.triggerCount})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {context.permissionsFlags.canUpdate ? (
              <div className="space-y-2">
                <Label htmlFor="trigger-event">Primary event</Label>
                <Input
                  id="trigger-event"
                  value={triggerEvent}
                  onChange={(event) => setTriggerEvent(event.target.value)}
                />
              </div>
            ) : null}
            <ul className="space-y-2 text-sm">
              {workflow.triggers.map((trigger) => (
                <li key={trigger.id}>
                  {trigger.type} — {trigger.event}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conditions ({workflow.conditionCount})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {workflow.conditions.length === 0 ? (
                <li className="text-muted-foreground">
                  No conditions — always runs when triggered.
                </li>
              ) : (
                workflow.conditions.map((condition) => (
                  <li key={condition.id}>
                    {condition.field} {condition.operator} {condition.value}
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions ({workflow.actionCount})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {context.permissionsFlags.canUpdate ? (
              <div className="space-y-2">
                <Label htmlFor="action-type">Primary action</Label>
                <Input
                  id="action-type"
                  value={actionType}
                  onChange={(event) => setActionType(event.target.value)}
                />
              </div>
            ) : null}
            <ul className="space-y-2 text-sm">
              {workflow.actions.map((action) => (
                <li key={action.id}>
                  #{action.order} {action.type}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {context.permissionsFlags.canUpdate ? (
          <Button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await saveWorkflowBuilderAction(workflow.id, {
                  triggers: [{ type: "event", event: triggerEvent }],
                  conditions: workflow.conditions.map((condition) => ({
                    operator: condition.operator,
                    field: condition.field,
                    value: condition.value,
                  })),
                  actions: [
                    {
                      type: actionType,
                      order: 1,
                      configuration: {},
                    },
                  ],
                });
              })
            }
          >
            Save builder
          </Button>
        ) : null}
        {context.permissionsFlags.canExecute ? (
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await executeAutomationWorkflowAction(workflow.id, {
                  event: triggerEvent,
                });
                setTestResult(`Execution ${result.id}: ${result.status}`);
              })
            }
          >
            Test run
          </Button>
        ) : null}
      </div>

      {testResult ? <p className="text-muted-foreground text-sm">{testResult}</p> : null}
    </div>
  );
}
