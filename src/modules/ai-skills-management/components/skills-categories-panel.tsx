"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkillsNav } from "@/modules/ai-skills-management/components/skills-nav";
import type { AiSkillsContext } from "@/modules/ai-skills-management/lib/get-ai-skills-context";
import type { SkillCategoryRecord } from "@/modules/ai-skills-management/types/ai-skills-types";

interface SkillsCategoriesPanelProps {
  context: AiSkillsContext;
  categories: SkillCategoryRecord[];
}

export function SkillsCategoriesPanel({ categories }: SkillsCategoriesPanelProps) {
  return (
    <div className="space-y-8">
      <SkillsNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skill Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="rounded-lg border p-4"
                style={category.color ? { borderColor: category.color } : undefined}
              >
                <p className="font-medium">{category.name}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {category.description ?? "No description"}
                </p>
                <p className="text-muted-foreground mt-2 text-xs">
                  {category.skillCount} skills · icon {category.icon ?? "default"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
