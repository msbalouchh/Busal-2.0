"use client";

import Link from "next/link";
import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  deleteAutomationWorkflowAction,
  executeAutomationWorkflowAction,
  pauseAutomationWorkflowAction,
  resumeAutomationWorkflowAction,
} from "@/modules/automation-platform-management/actions/automation-platform-actions";
import { AutomationPlatformNav } from "@/modules/automation-platform-management/components/automation-platform-nav";
import { AUTOMATION_PLATFORM_ROUTES } from "@/modules/automation-platform-management/constants/routes";
import type { AutomationPlatformContext } from "@/modules/automation-platform-management/lib/get-automation-platform-context";
import type { AutomationWorkflowRecord } from "@/modules/automation-platform-management/types/automation-platform-types";

interface AutomationWorkflowListPanelProps {
  context: AutomationPlatformContext;
  workflows: AutomationWorkflowRecord[];
}

export function AutomationWorkflowListPanel({
  context,
  workflows,
}: AutomationWorkflowListPanelProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <AutomationPlatformNav />

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Manage business process automations.</p>
        {context.permissionsFlags.canCreate ? (
          <Button asChild>
            <Link href={AUTOMATION_PLATFORM_ROUTES.workflowNew()}>New workflow</Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workflows ({workflows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No workflows configured.</p>
          ) : (
            <ul className="space-y-4">
              {workflows.map((workflow) => (
                <li
                  key={workflow.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <Link
                      href={AUTOMATION_PLATFORM_ROUTES.workflowDetail(workflow.id)}
                      className="font-medium hover:underline"
                    >
                      {workflow.name}
                    </Link>
                    <p className="text-muted-foreground text-sm">
                      {workflow.description || "No description"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">{workflow.status}</Badge>
                      <Badge variant="outline">{workflow.triggerType}</Badge>
                      <Badge variant="outline">{workflow.executionCount} runs</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {context.permissionsFlags.canExecute ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() =>
                            startTransition(async () => {
                              await executeAutomationWorkflowAction(workflow.id, {
                                event: "manual.event",
                              });
                            })
                          }
                        >
                          Run
                        </Button>
                        {workflow.status === "ACTIVE" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() =>
                              startTransition(async () => {
                                await pauseAutomationWorkflowAction(workflow.id);
                              })
                            }
                          >
                            Pause
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() =>
                              startTransition(async () => {
                                await resumeAutomationWorkflowAction(workflow.id);
                              })
                            }
                          >
                            Resume
                          </Button>
                        )}
                      </>
                    ) : null}
                    {context.permissionsFlags.canDelete ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            await deleteAutomationWorkflowAction(workflow.id);
                          })
                        }
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
