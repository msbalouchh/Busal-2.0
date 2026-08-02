"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSkillConfigurationAction } from "@/modules/ai-skills-management/actions/ai-skills-actions";
import { SkillsNav } from "@/modules/ai-skills-management/components/skills-nav";
import { AI_SKILLS_ROUTES } from "@/modules/ai-skills-management/constants/routes";
import type { AiSkillsContext } from "@/modules/ai-skills-management/lib/get-ai-skills-context";
import type { SkillListResult } from "@/modules/ai-skills-management/types/ai-skills-types";

interface SkillsSettingsPanelProps {
  context: AiSkillsContext;
  skills: SkillListResult;
}

export function SkillsSettingsPanel({ skills }: SkillsSettingsPanelProps) {
  const [isPending, startTransition] = useTransition();

  const markConfigured = (skillId: string) => {
    startTransition(async () => {
      await updateSkillConfigurationAction(skillId, {
        configuredAt: new Date().toISOString(),
        framework: "ai-skills-library",
      });
    });
  };

  return (
    <div className="space-y-8">
      <SkillsNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skill Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {skills.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">No skills available to configure.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {skills.items.map((skill) => (
                <li
                  key={skill.id}
                  className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <Link
                      href={AI_SKILLS_ROUTES.skill(skill.id)}
                      className="hover:text-primary font-medium transition-colors"
                    >
                      {skill.name}
                    </Link>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Update configuration metadata for this skill template.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => markConfigured(skill.id)}
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Mark configured
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
