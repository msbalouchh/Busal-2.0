"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkillsNav } from "@/modules/ai-skills-management/components/skills-nav";
import { AI_SKILLS_ROUTES } from "@/modules/ai-skills-management/constants/routes";
import type { AiSkillsContext } from "@/modules/ai-skills-management/lib/get-ai-skills-context";
import type { SkillExecutionRecord } from "@/modules/ai-skills-management/types/ai-skills-types";

interface SkillsExecutionsPanelProps {
  context: AiSkillsContext;
  executions: SkillExecutionRecord[];
}

export function SkillsExecutionsPanel({ executions }: SkillsExecutionsPanelProps) {
  return (
    <div className="space-y-8">
      <SkillsNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skill Execution History</CardTitle>
        </CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No skill executions yet.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {executions.map((execution) => (
                <li key={execution.id} className="p-4">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <Link
                        href={AI_SKILLS_ROUTES.skill(execution.skillId)}
                        className="hover:text-primary font-medium transition-colors"
                      >
                        {execution.skillName ?? execution.skillId}
                      </Link>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {execution.status}
                        {execution.duration ? ` · ${execution.duration}ms` : ""}
                      </p>
                    </div>
                    <time className="text-muted-foreground text-xs">
                      {new Date(execution.createdAt).toLocaleString()}
                    </time>
                  </div>
                  {execution.error ? (
                    <p className="text-destructive mt-2 text-xs">{execution.error}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
