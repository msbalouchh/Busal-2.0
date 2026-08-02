"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceAgentNav } from "@/modules/ai-voice-agent-management/components/voice-agent-nav";
import type {
  VoiceAnalyticsSnapshot,
  VoiceIntentDefinition,
} from "@/modules/ai-voice-agent-management/types/ai-voice-agent-types";

interface VoiceAnalyticsPanelProps {
  analytics: VoiceAnalyticsSnapshot;
  intents: VoiceIntentDefinition[];
}

export function VoiceAnalyticsPanel({ analytics, intents }: VoiceAnalyticsPanelProps) {
  return (
    <div className="space-y-8">
      <VoiceAgentNav />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{analytics.totalSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{analytics.activeSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Commands processed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{analytics.processedCommands}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{analytics.successRate}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top intents</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topIntents.length === 0 ? (
              <p className="text-muted-foreground text-sm">No intent data yet.</p>
            ) : (
              <ul className="space-y-2">
                {analytics.topIntents.map((row) => {
                  const intent = intents.find((item) => item.intent === row.intent);
                  return (
                    <li key={row.intent} className="flex justify-between text-sm">
                      <span>{intent?.label ?? row.intent}</span>
                      <span className="text-muted-foreground">{row.count}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Voice activity timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.activityTimeline.length === 0 ? (
              <p className="text-muted-foreground text-sm">No activity recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {analytics.activityTimeline.map((point) => (
                  <li key={point.label} className="flex justify-between text-sm">
                    <span>{point.label}</span>
                    <span className="text-muted-foreground">
                      {point.sessions} sessions · {point.commands} commands
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
