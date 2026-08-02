"use client";

import Link from "next/link";
import { Brain, Pin, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemoryNav } from "@/modules/ai-memory-management/components/memory-nav";
import { AI_MEMORY_ROUTES } from "@/modules/ai-memory-management/constants/routes";
import type { AiMemoryContext } from "@/modules/ai-memory-management/lib/get-ai-memory-context";
import type {
  MemoryCollectionRecord,
  MemoryDashboardStats,
  MemoryListResult,
  MemoryTimelineEntry,
} from "@/modules/ai-memory-management/types/ai-memory-types";

interface MemoryDashboardPanelProps {
  context: AiMemoryContext;
  stats: MemoryDashboardStats;
  recent: MemoryListResult;
  timeline: MemoryTimelineEntry[];
  collections: MemoryCollectionRecord[];
}

export function MemoryDashboardPanel({
  stats,
  recent,
  timeline,
  collections,
}: MemoryDashboardPanelProps) {
  const statCards = [
    { label: "Total memories", value: stats.totalMemories, icon: Brain },
    { label: "Short-term", value: stats.shortTermMemories, icon: Sparkles },
    { label: "Long-term", value: stats.longTermMemories, icon: Brain },
    { label: "Pinned", value: stats.pinnedMemories, icon: Pin },
    { label: "Collections", value: stats.totalCollections, icon: Brain },
    { label: "Expiring soon", value: stats.expiringSoon, icon: Sparkles },
  ];

  return (
    <div className="space-y-8">
      <MemoryNav />

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
            <CardTitle className="text-base">Recent memories</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.items.length === 0 ? (
              <p className="text-muted-foreground text-sm">No memories stored yet.</p>
            ) : (
              <ul className="space-y-3">
                {recent.items.map((memory) => (
                  <li key={memory.id} className="border-b pb-3 last:border-0 last:pb-0">
                    <Link
                      href={AI_MEMORY_ROUTES.memory(memory.id)}
                      className="hover:text-primary font-medium transition-colors"
                    >
                      {memory.title}
                    </Link>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                      {memory.content}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {memory.memoryType} · score {memory.importanceScore.toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeline preview</CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="text-muted-foreground text-sm">No timeline entries yet.</p>
            ) : (
              <ul className="space-y-3">
                {timeline.slice(0, 8).map((entry) => (
                  <li key={entry.id} className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={AI_MEMORY_ROUTES.memory(entry.id)}
                        className="hover:text-primary text-sm font-medium transition-colors"
                      >
                        {entry.title}
                      </Link>
                      <p className="text-muted-foreground text-xs">{entry.memoryType}</p>
                    </div>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Collections</CardTitle>
        </CardHeader>
        <CardContent>
          {collections.length === 0 ? (
            <p className="text-muted-foreground text-sm">No collections created yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {collections.slice(0, 6).map((collection) => (
                <div key={collection.id} className="rounded-lg border p-4">
                  <p className="font-medium">{collection.name}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {collection.description ?? "No description"}
                  </p>
                  <p className="text-muted-foreground mt-2 text-xs">
                    {collection.memoryCount} memories
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
