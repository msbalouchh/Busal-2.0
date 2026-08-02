"use client";

import Link from "next/link";
import { Bot, MessageSquare, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssistantNav } from "@/modules/ai-restaurant-assistant-management/components/assistant-nav";
import {
  BusinessHealthCard,
  InsightCardsGrid,
  PeriodSummaryCards,
} from "@/modules/ai-restaurant-assistant-management/components/insight-cards";
import { RecommendationCards } from "@/modules/ai-restaurant-assistant-management/components/recommendation-cards";
import {
  AI_RESTAURANT_ASSISTANT_ROUTES,
  SUGGESTED_PROMPTS,
} from "@/modules/ai-restaurant-assistant-management/constants/routes";
import type { AiRestaurantAssistantContext } from "@/modules/ai-restaurant-assistant-management/lib/get-ai-restaurant-assistant-context";
import type {
  BusinessHealthSummary,
  ConversationRecord,
  PeriodSummary,
  RecommendationRecord,
} from "@/modules/ai-restaurant-assistant-management/types/ai-restaurant-assistant-types";

interface AssistantDashboardPanelProps {
  context: AiRestaurantAssistantContext;
  health: BusinessHealthSummary;
  summaries: PeriodSummary[];
  recommendations: RecommendationRecord[];
  recentConversations: ConversationRecord[];
}

export function AssistantDashboardPanel({
  context,
  health,
  summaries,
  recommendations,
  recentConversations,
}: AssistantDashboardPanelProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">AI Restaurant Assistant</h2>
          <p className="text-muted-foreground text-sm">
            Intelligent insights across sales, operations, inventory, and customer activity.
          </p>
        </div>
        {context.permissionsFlags.canChat ? (
          <Button asChild>
            <Link href={AI_RESTAURANT_ASSISTANT_ROUTES.chat()}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Open chat
            </Link>
          </Button>
        ) : null}
      </div>

      <AssistantNav />

      <div className="grid gap-4 lg:grid-cols-3">
        <BusinessHealthCard health={health} />
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              Quick actions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.slice(0, 6).map((prompt) => (
              <Button key={prompt} type="button" variant="outline" size="sm" asChild>
                <Link href={AI_RESTAURANT_ASSISTANT_ROUTES.chat()}>{prompt}</Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <InsightCardsGrid insights={health.highlights} title="Today's highlights" />
      <PeriodSummaryCards summaries={summaries} />

      {context.permissionsFlags.canViewRecommendations ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recommendation center</h3>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={AI_RESTAURANT_ASSISTANT_ROUTES.recommendations()}>View all</Link>
            </Button>
          </div>
          <RecommendationCards
            recommendations={recommendations.slice(0, 4)}
            canManage={context.permissionsFlags.canManageRecommendations}
          />
        </section>
      ) : null}

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Recent conversations</h3>
        {recentConversations.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground flex items-center gap-3 py-8 text-sm">
              <Bot className="h-5 w-5" />
              Start a conversation to build your assistant history.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {recentConversations.map((conversation) => (
              <Card key={conversation.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    <Link
                      href={AI_RESTAURANT_ASSISTANT_ROUTES.chat(conversation.id)}
                      className="hover:underline"
                    >
                      {conversation.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                {conversation.lastMessagePreview ? (
                  <CardContent className="text-muted-foreground text-sm">
                    {conversation.lastMessagePreview}
                  </CardContent>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
