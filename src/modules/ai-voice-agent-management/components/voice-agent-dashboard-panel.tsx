"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Mic, MessageSquare, Radio, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceAgentNav } from "@/modules/ai-voice-agent-management/components/voice-agent-nav";
import { AI_VOICE_AGENT_ROUTES } from "@/modules/ai-voice-agent-management/constants/routes";
import { startVoiceSessionAction } from "@/modules/ai-voice-agent-management/actions/ai-voice-agent-actions";
import type { AiVoiceAgentContext } from "@/modules/ai-voice-agent-management/lib/get-ai-voice-agent-context";
import type {
  VoiceCommandRecord,
  VoiceIntentDefinition,
  VoiceSessionRecord,
} from "@/modules/ai-voice-agent-management/types/ai-voice-agent-types";
import type { VoiceAgentDashboardStats } from "@/services/ai-voice-analytics.service";

interface VoiceAgentDashboardPanelProps {
  context: AiVoiceAgentContext;
  stats: VoiceAgentDashboardStats;
  sessions: VoiceSessionRecord[];
  commands: VoiceCommandRecord[];
  intents: VoiceIntentDefinition[];
}

export function VoiceAgentDashboardPanel({
  context,
  stats,
  sessions,
  commands,
  intents,
}: VoiceAgentDashboardPanelProps) {
  const [isPending, startTransition] = useTransition();

  const cards = [
    {
      label: "Active sessions",
      value: stats.activeSessions,
      sub: `${stats.totalSessions} total sessions`,
      icon: Radio,
    },
    {
      label: "Voice commands",
      value: stats.totalCommands,
      sub: `${stats.processedCommands} processed`,
      icon: MessageSquare,
    },
    {
      label: "Success rate",
      value: `${stats.successRate}%`,
      sub: "Command processing",
      icon: TrendingUp,
    },
    {
      label: "Supported intents",
      value: intents.length,
      sub: "Provider-agnostic routing",
      icon: Mic,
    },
  ];

  return (
    <div className="space-y-8">
      <VoiceAgentNav />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          Voice interaction for {context.business.businessName ?? "your business"}.
        </p>
        {context.permissionsFlags.canExecute ? (
          <Button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const session = await startVoiceSessionAction();
                window.location.href = AI_VOICE_AGENT_ROUTES.sessionDetail(session.id);
              })
            }
          >
            {isPending ? "Starting…" : "Start voice session"}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <card.icon className="text-muted-foreground h-4 w-4" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{card.value}</p>
              <p className="text-muted-foreground text-xs">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent sessions</CardTitle>
            <Link
              href={AI_VOICE_AGENT_ROUTES.sessions()}
              className="text-primary text-sm hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No voice sessions yet.</p>
            ) : (
              <ul className="space-y-3">
                {sessions.map((session) => (
                  <li key={session.id} className="border-b pb-3 last:border-0 last:pb-0">
                    <Link
                      href={AI_VOICE_AGENT_ROUTES.sessionDetail(session.id)}
                      className="font-medium hover:underline"
                    >
                      {session.status} · {session.language}
                    </Link>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {session.commandCount} commands ·{" "}
                      {new Date(session.startedAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent commands</CardTitle>
            <Link
              href={AI_VOICE_AGENT_ROUTES.commands()}
              className="text-primary text-sm hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {commands.length === 0 ? (
              <p className="text-muted-foreground text-sm">No commands processed yet.</p>
            ) : (
              <ul className="space-y-3">
                {commands.map((command) => (
                  <li key={command.id} className="border-b pb-3 last:border-0 last:pb-0">
                    <p className="font-medium">{command.command}</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {command.intent ?? "unknown"} · {command.status}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Example voice commands</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2">
            {intents.slice(0, 8).map((intent) => (
              <li key={intent.intent} className="text-sm">
                <span className="font-medium">{intent.label}</span>
                <span className="text-muted-foreground"> — {intent.exampleCommands[0]}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
