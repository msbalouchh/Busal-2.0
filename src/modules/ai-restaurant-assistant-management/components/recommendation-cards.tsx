"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateRecommendationAction } from "@/modules/ai-restaurant-assistant-management/actions/ai-restaurant-assistant-actions";
import type { RecommendationRecord } from "@/modules/ai-restaurant-assistant-management/types/ai-restaurant-assistant-types";

interface RecommendationCardsProps {
  recommendations: RecommendationRecord[];
  canManage: boolean;
}

const PRIORITY_STYLES: Record<RecommendationRecord["priority"], string> = {
  LOW: "border-muted",
  MEDIUM: "border-blue-500/30",
  HIGH: "border-amber-500/40",
  CRITICAL: "border-red-500/50",
};

export function RecommendationCards({ recommendations, canManage }: RecommendationCardsProps) {
  const [isPending, startTransition] = useTransition();

  const handleStatus = (id: string, status: RecommendationRecord["status"]) => {
    startTransition(async () => {
      await updateRecommendationAction(id, { status });
    });
  };

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-center text-sm">
          No active recommendations. The assistant will surface insights as your data changes.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {recommendations.map((recommendation) => (
        <Card key={recommendation.id} className={PRIORITY_STYLES[recommendation.priority]}>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">{recommendation.title}</CardTitle>
            <p className="text-muted-foreground text-xs uppercase">{recommendation.priority}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{recommendation.description}</p>
            {recommendation.action ? (
              <a href={recommendation.action} className="text-primary text-sm hover:underline">
                View related module
              </a>
            ) : null}
            {canManage ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleStatus(recommendation.id, "IMPLEMENTED")}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Done
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => handleStatus(recommendation.id, "DISMISSED")}
                >
                  <X className="mr-2 h-4 w-4" />
                  Dismiss
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
