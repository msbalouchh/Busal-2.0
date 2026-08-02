"use client";

import { useTransition } from "react";
import { Loader2, Play, Power, PowerOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  disableSkillAction,
  enableSkillAction,
  executeSkillAction,
} from "@/modules/ai-skills-management/actions/ai-skills-actions";
import { SkillsNav } from "@/modules/ai-skills-management/components/skills-nav";
import type { AiSkillsContext } from "@/modules/ai-skills-management/lib/get-ai-skills-context";
import type {
  SkillExecutionRecord,
  SkillRecord,
} from "@/modules/ai-skills-management/types/ai-skills-types";

interface SkillDetailPanelProps {
  context: AiSkillsContext;
  skill: SkillRecord;
  executions: SkillExecutionRecord[];
}

export function SkillDetailPanel({ context, skill, executions }: SkillDetailPanelProps) {
  const [isPending, startTransition] = useTransition();

  const runAction = (action: () => Promise<unknown>) => {
    startTransition(async () => {
      await action();
    });
  };

  return (
    <div className="space-y-8">
      <SkillsNav />

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{skill.name}</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              {skill.category} · {skill.status} · v{skill.version}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {context.permissionsFlags.canUpdate ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending || skill.status === "ACTIVE"}
                  onClick={() => runAction(() => enableSkillAction(skill.id))}
                >
                  <Power className="h-4 w-4" />
                  Enable
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending || skill.status === "DISABLED"}
                  onClick={() => runAction(() => disableSkillAction(skill.id))}
                >
                  <PowerOff className="h-4 w-4" />
                  Disable
                </Button>
              </>
            ) : null}
            {context.permissionsFlags.canExecute && skill.status === "ACTIVE" ? (
              <Button
                size="sm"
                disabled={isPending}
                onClick={() =>
                  runAction(() => executeSkillAction({ skillId: skill.id, input: {} }))
                }
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Execute
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-sm">{skill.description ?? "No description"}</p>

          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <h3 className="text-sm font-medium">Configuration</h3>
              <pre className="bg-muted mt-2 overflow-x-auto rounded-md p-3 text-xs">
                {JSON.stringify(skill.configuration, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="text-sm font-medium">Input schema</h3>
              <pre className="bg-muted mt-2 overflow-x-auto rounded-md p-3 text-xs">
                {JSON.stringify(skill.inputSchema, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="text-sm font-medium">Output schema</h3>
              <pre className="bg-muted mt-2 overflow-x-auto rounded-md p-3 text-xs">
                {JSON.stringify(skill.outputSchema, null, 2)}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium">Execution history</h3>
            {executions.length === 0 ? (
              <p className="text-muted-foreground mt-2 text-sm">No executions yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {executions.map((execution) => (
                  <li key={execution.id} className="rounded-md border px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span>{execution.status}</span>
                      <time className="text-muted-foreground text-xs">
                        {new Date(execution.createdAt).toLocaleString()}
                      </time>
                    </div>
                    {execution.error ? (
                      <p className="text-destructive mt-1 text-xs">{execution.error}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
