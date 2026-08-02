"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HrAgentNav } from "@/modules/ai-hr-agent-management/components/hr-agent-nav";
import type { TrainingSuggestion } from "@/services/ai-hr-training-recommendation.service";

interface HrTrainingPanelProps {
  training: TrainingSuggestion[];
}

export function HrTrainingPanel({ training }: HrTrainingPanelProps) {
  return (
    <div className="space-y-8">
      <HrAgentNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Training suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          {training.length === 0 ? (
            <p className="text-muted-foreground text-sm">No training recommendations yet.</p>
          ) : (
            <ul className="space-y-4">
              {training.map((item) => (
                <li key={item.staffId} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-muted-foreground mt-1 text-sm">{item.reason}</p>
                      <p className="mt-2 text-sm">{item.program}</p>
                    </div>
                    <Badge variant="secondary">{item.priority}</Badge>
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
