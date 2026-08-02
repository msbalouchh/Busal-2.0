"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Loader2, Sparkles, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { registerBuiltInSkillsAction } from "@/modules/ai-skills-management/actions/ai-skills-actions";
import { SkillsNav } from "@/modules/ai-skills-management/components/skills-nav";
import { AI_SKILLS_ROUTES } from "@/modules/ai-skills-management/constants/routes";
import type { AiSkillsContext } from "@/modules/ai-skills-management/lib/get-ai-skills-context";
import type {
  SkillDashboardStats,
  SkillDiscoveryEntry,
  SkillListResult,
} from "@/modules/ai-skills-management/types/ai-skills-types";

interface SkillsDashboardPanelProps {
  context: AiSkillsContext;
  stats: SkillDashboardStats;
  recent: SkillListResult;
  discovery: SkillDiscoveryEntry[];
}

export function SkillsDashboardPanel({
  context,
  stats,
  recent,
  discovery,
}: SkillsDashboardPanelProps) {
  const [isPending, startTransition] = useTransition();

  const statCards = [
    { label: "Total skills", value: stats.totalSkills, icon: Sparkles },
    { label: "Active", value: stats.activeSkills, icon: Wrench },
    { label: "Draft", value: stats.draftSkills, icon: Sparkles },
    { label: "Executions", value: stats.totalExecutions, icon: Wrench },
    { label: "Failed", value: stats.failedExecutions, icon: Sparkles },
    { label: "Categories", value: stats.categories, icon: Wrench },
  ];

  const handleSeed = () => {
    startTransition(async () => {
      await registerBuiltInSkillsAction();
    });
  };

  return (
    <div className="space-y-8">
      <SkillsNav />

      {context.permissionsFlags.canCreate ? (
        <div className="flex justify-end">
          <Button onClick={handleSeed} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Register built-in skills
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <card.icon className="text-muted-foreground h-4 w-4" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent skills</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.items.length === 0 ? (
              <p className="text-muted-foreground text-sm">No skills registered yet.</p>
            ) : (
              <ul className="space-y-3">
                {recent.items.map((skill) => (
                  <li key={skill.id} className="border-b pb-3 last:border-0 last:pb-0">
                    <Link
                      href={AI_SKILLS_ROUTES.skill(skill.id)}
                      className="hover:text-primary font-medium transition-colors"
                    >
                      {skill.name}
                    </Link>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {skill.category} · {skill.status} · v{skill.version}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Built-in templates</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {discovery.slice(0, 8).map((entry) => (
                <li key={entry.slug} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{entry.name}</p>
                    <p className="text-muted-foreground text-xs">{entry.category}</p>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {entry.isRegistered ? "Registered" : "Template"}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
