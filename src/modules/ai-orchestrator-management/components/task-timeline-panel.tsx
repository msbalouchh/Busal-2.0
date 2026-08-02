"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrchestratorNav } from "@/modules/ai-orchestrator-management/components/orchestrator-nav";
import type { AiOrchestratorContext } from "@/modules/ai-orchestrator-management/lib/get-ai-orchestrator-context";
import type { WorkflowTimelineEntry } from "@/modules/ai-orchestrator-management/types/ai-orchestrator-types";

interface TaskTimelinePanelProps {
  context: AiOrchestratorContext;
  timeline: WorkflowTimelineEntry[];
}

export function TaskTimelinePanel({ timeline }: TaskTimelinePanelProps) {
  return (
    <div className="space-y-8">
      <OrchestratorNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Task Timeline</CardTitle>
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
                    <p className="text-sm font-medium">{entry.workflowName}</p>
                    <time className="text-muted-foreground text-xs">
                      {new Date(entry.createdAt).toLocaleString()}
                    </time>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {entry.status}
                    {entry.duration ? ` · ${entry.duration}ms` : ""}
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
