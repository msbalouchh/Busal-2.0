"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MemoryNav } from "@/modules/ai-memory-management/components/memory-nav";
import {
  AI_MEMORY_ROUTES,
  MEMORY_TYPE_OPTIONS,
} from "@/modules/ai-memory-management/constants/routes";
import type { AiMemoryContext } from "@/modules/ai-memory-management/lib/get-ai-memory-context";
import type { MemoryListResult } from "@/modules/ai-memory-management/types/ai-memory-types";

interface MemoryExplorerPanelProps {
  context: AiMemoryContext;
  list: MemoryListResult;
}

export function MemoryExplorerPanel({ list }: MemoryExplorerPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [memoryType, setMemoryType] = useState<string>("ALL");

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (memoryType !== "ALL") params.set("memoryType", memoryType);
    startTransition(() => {
      router.push(`${AI_MEMORY_ROUTES.explorer()}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-8">
      <MemoryNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Memory Explorer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search memories"
              aria-label="Search memories"
            />
            <select
              value={memoryType}
              onChange={(event) => setMemoryType(event.target.value)}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none lg:w-48"
              aria-label="Memory type"
            >
              {MEMORY_TYPE_OPTIONS.map((option) => (
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

          {list.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">No memories match the current filters.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {list.items.map((memory) => (
                <li key={memory.id} className="p-4">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <Link
                        href={AI_MEMORY_ROUTES.memory(memory.id)}
                        className="hover:text-primary font-medium transition-colors"
                      >
                        {memory.title}
                      </Link>
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                        {memory.content}
                      </p>
                    </div>
                    <div className="text-muted-foreground shrink-0 text-xs">
                      <p>{memory.memoryType}</p>
                      <p>Score {memory.importanceScore.toFixed(2)}</p>
                      {memory.isPinned ? <p>Pinned</p> : null}
                      {memory.isArchived ? <p>Archived</p> : null}
                    </div>
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
