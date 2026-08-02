"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { registerSkillTemplateAction } from "@/modules/ai-skills-management/actions/ai-skills-actions";
import { SkillsNav } from "@/modules/ai-skills-management/components/skills-nav";
import {
  AI_SKILLS_ROUTES,
  SKILL_CATEGORY_OPTIONS,
  SKILL_STATUS_OPTIONS,
} from "@/modules/ai-skills-management/constants/routes";
import type { AiSkillsContext } from "@/modules/ai-skills-management/lib/get-ai-skills-context";
import type {
  SkillDiscoveryEntry,
  SkillListResult,
} from "@/modules/ai-skills-management/types/ai-skills-types";

interface SkillsRegistryPanelProps {
  context: AiSkillsContext;
  list: SkillListResult;
  discovery: SkillDiscoveryEntry[];
}

export function SkillsRegistryPanel({ context, list, discovery }: SkillsRegistryPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (category !== "ALL") params.set("category", category);
    if (status !== "ALL") params.set("status", status);
    startTransition(() => {
      router.push(`${AI_SKILLS_ROUTES.registry()}?${params.toString()}`);
    });
  };

  const registerTemplate = (slug: string) => {
    startTransition(async () => {
      await registerSkillTemplateAction(slug);
    });
  };

  return (
    <div className="space-y-8">
      <SkillsNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skills Registry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search skills"
              aria-label="Search skills"
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="border-input bg-background h-10 rounded-md border px-3 text-sm lg:w-48"
              aria-label="Skill category"
            >
              {SKILL_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="border-input bg-background h-10 rounded-md border px-3 text-sm lg:w-48"
              aria-label="Skill status"
            >
              {SKILL_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button onClick={applyFilters} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Filter
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-medium">Registered skills</h3>
              {list.items.length === 0 ? (
                <p className="text-muted-foreground text-sm">No registered skills found.</p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {list.items.map((skill) => (
                    <li key={skill.id} className="p-4">
                      <Link
                        href={AI_SKILLS_ROUTES.skill(skill.id)}
                        className="hover:text-primary font-medium transition-colors"
                      >
                        {skill.name}
                      </Link>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {skill.category} · {skill.status} · {skill.executionCount} executions
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-medium">Available templates</h3>
              <ul className="divide-y rounded-lg border">
                {discovery.map((entry) => (
                  <li key={entry.slug} className="flex items-start justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium">{entry.name}</p>
                      <p className="text-muted-foreground text-sm">{entry.description}</p>
                    </div>
                    {context.permissionsFlags.canCreate && !entry.isRegistered ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => registerTemplate(entry.slug)}
                      >
                        Register
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
