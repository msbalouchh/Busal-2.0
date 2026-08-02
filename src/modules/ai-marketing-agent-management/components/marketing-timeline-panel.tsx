"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingAgentNav } from "@/modules/ai-marketing-agent-management/components/marketing-agent-nav";

interface MarketingTimelinePanelProps {
  timeline: {
    insights: Array<{
      id: string;
      title: string;
      category: string;
      createdAt: Date;
      priority: string;
    }>;
    campaigns: Array<{
      id: string;
      name: string;
      status: string;
      updatedAt: Date;
      type: string;
    }>;
  };
}

export function MarketingTimelinePanel({ timeline }: MarketingTimelinePanelProps) {
  const events = [
    ...timeline.insights.map((item) => ({
      id: `insight-${item.id}`,
      date: item.createdAt,
      title: item.title,
      type: "insight" as const,
      meta: item.category,
      priority: item.priority,
    })),
    ...timeline.campaigns.map((item) => ({
      id: `campaign-${item.id}`,
      date: item.updatedAt,
      title: item.name,
      type: "campaign" as const,
      meta: item.type,
      priority: item.status,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-8">
      <MarketingAgentNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Marketing timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-muted-foreground text-sm">No marketing activity yet.</p>
          ) : (
            <ul className="space-y-4">
              {events.map((event) => (
                <li key={event.id} className="flex gap-4 border-b pb-4 last:border-0 last:pb-0">
                  <div className="text-muted-foreground w-24 shrink-0 text-xs">
                    {event.date.toLocaleDateString()}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{event.title}</p>
                      <Badge variant="outline">{event.type}</Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm capitalize">{event.meta}</p>
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
