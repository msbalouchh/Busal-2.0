"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceAgentNav } from "@/modules/ai-voice-agent-management/components/voice-agent-nav";
import { AI_VOICE_AGENT_ROUTES } from "@/modules/ai-voice-agent-management/constants/routes";
import type { VoiceSessionRecord } from "@/modules/ai-voice-agent-management/types/ai-voice-agent-types";

interface VoiceSessionsPanelProps {
  sessions: { items: VoiceSessionRecord[]; total: number };
}

export function VoiceSessionsPanel({ sessions }: VoiceSessionsPanelProps) {
  return (
    <div className="space-y-8">
      <VoiceAgentNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Voice sessions ({sessions.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">No voice sessions found.</p>
          ) : (
            <ul className="space-y-3">
              {sessions.items.map((session) => (
                <li key={session.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link
                        href={AI_VOICE_AGENT_ROUTES.sessionDetail(session.id)}
                        className="font-medium hover:underline"
                      >
                        Session {session.id.slice(0, 8)}
                      </Link>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {session.staffName ?? "Unassigned staff"}
                        {session.customerName ? ` · ${session.customerName}` : ""}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Started {new Date(session.startedAt).toLocaleString()}
                        {session.endedAt
                          ? ` · Ended ${new Date(session.endedAt).toLocaleString()}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{session.language}</Badge>
                      <Badge variant="secondary">{session.status}</Badge>
                      <Badge variant="outline">{session.commandCount} cmds</Badge>
                    </div>
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
