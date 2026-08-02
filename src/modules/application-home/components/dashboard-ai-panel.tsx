"use client";

import Link from "next/link";
import { Bot, Lightbulb } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { AI_RESTAURANT_ASSISTANT_ROUTES } from "@/modules/ai-restaurant-assistant-management/constants/routes";

interface DashboardAiPanelProps {
  insights: string[];
  summary: string;
}

export function DashboardAiPanel({ insights, summary }: DashboardAiPanelProps) {
  return (
    <Card
      className={cn(
        "from-primary/5 border-primary/10 h-full rounded-xl bg-gradient-to-br to-transparent shadow-sm",
        motion.cardHover,
      )}
    >
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Busal AI Assistant</CardTitle>
              <p className="text-muted-foreground text-sm">Insights based on live workspace data</p>
            </div>
          </div>
          <Badge variant="secondary">Live</Badge>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-5 pt-2">
        <p className="text-muted-foreground text-sm leading-relaxed">{summary}</p>

        <section aria-labelledby="ai-insights-title">
          <h3 id="ai-insights-title" className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="h-4 w-4" aria-hidden="true" />
            Business insights
          </h3>
          {insights.length === 0 ? (
            <p className="text-muted-foreground text-sm" role="status">
              Insights will appear as your business generates more activity.
            </p>
          ) : (
            <ul className="space-y-3">
              {insights.map((insight) => (
                <li
                  key={insight}
                  className="bg-muted/40 text-muted-foreground rounded-lg border px-3 py-2.5 text-sm leading-relaxed"
                >
                  {insight}
                </li>
              ))}
            </ul>
          )}
        </section>

        <Button asChild variant="outline" size="sm" className={motion.buttonPress}>
          <Link href={AI_RESTAURANT_ASSISTANT_ROUTES.chat()}>Open AI assistant</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
