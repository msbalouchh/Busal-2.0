"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemoryNav } from "@/modules/ai-memory-management/components/memory-nav";
import { AI_MEMORY_ROUTES } from "@/modules/ai-memory-management/constants/routes";
import type { AiMemoryContext } from "@/modules/ai-memory-management/lib/get-ai-memory-context";
import type { MemoryTimelineEntry } from "@/modules/ai-memory-management/types/ai-memory-types";

interface MemoryTimelinePanelProps {
  context: AiMemoryContext;
  timeline: MemoryTimelineEntry[];
}

export function MemoryTimelinePanel({ timeline }: MemoryTimelinePanelProps) {
  return (
    <div className="space-y-8">
      <MemoryNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Memory Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-muted-foreground text-sm">No timeline entries yet.</p>
          ) : (
            <ol className="relative border-s pl-6">
              {timeline.map((entry) => (
                <li key={entry.id} className="mb-6 last:mb-0">
                  <span className="bg-primary absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full" />
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                      href={AI_MEMORY_ROUTES.memory(entry.id)}
                      className="hover:text-primary font-medium transition-colors"
                    >
                      {entry.title}
                    </Link>
                    <time className="text-muted-foreground text-xs">
                      {new Date(entry.createdAt).toLocaleString()}
                    </time>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {entry.memoryType} · importance {entry.importanceScore.toFixed(2)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
