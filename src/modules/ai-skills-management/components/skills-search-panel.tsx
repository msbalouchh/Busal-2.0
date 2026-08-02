"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SkillsNav } from "@/modules/ai-skills-management/components/skills-nav";
import { AI_SKILLS_ROUTES } from "@/modules/ai-skills-management/constants/routes";
import type { AiSkillsContext } from "@/modules/ai-skills-management/lib/get-ai-skills-context";
import type {
  SkillListQuery,
  SkillListResult,
} from "@/modules/ai-skills-management/types/ai-skills-types";

interface SkillsSearchPanelProps {
  context: AiSkillsContext;
  results: SkillListResult;
  query: SkillListQuery;
}

export function SkillsSearchPanel({ results, query }: SkillsSearchPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(query.search ?? "");

  const runSearch = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    startTransition(() => {
      router.push(`${AI_SKILLS_ROUTES.search()}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-8">
      <SkillsNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skill Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, slug, or description"
              aria-label="Search skills"
            />
            <Button onClick={runSearch} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
          </div>

          {results.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">No skills matched your search.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {results.items.map((skill) => (
                <li key={skill.id} className="p-4">
                  <Link
                    href={AI_SKILLS_ROUTES.skill(skill.id)}
                    className="hover:text-primary font-medium transition-colors"
                  >
                    {skill.name}
                  </Link>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {skill.slug} · {skill.category} · {skill.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
