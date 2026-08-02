"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatConfidence } from "@/modules/ai-voice-agent-management/lib/ai-voice-agent-validation";
import {
  processVoiceCommandAction,
  updateVoiceSessionStatusAction,
} from "@/modules/ai-voice-agent-management/actions/ai-voice-agent-actions";
import { VoiceAgentNav } from "@/modules/ai-voice-agent-management/components/voice-agent-nav";
import type { AiVoiceAgentContext } from "@/modules/ai-voice-agent-management/lib/get-ai-voice-agent-context";
import type {
  VoiceCommandRecord,
  VoiceSessionRecord,
} from "@/modules/ai-voice-agent-management/types/ai-voice-agent-types";

interface VoiceSessionDetailPanelProps {
  context: AiVoiceAgentContext;
  session: VoiceSessionRecord | null;
  commands: VoiceCommandRecord[];
}

export function VoiceSessionDetailPanel({
  context,
  session,
  commands,
}: VoiceSessionDetailPanelProps) {
  const [commandText, setCommandText] = useState("");
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!session) {
    return (
      <div className="space-y-8">
        <VoiceAgentNav />
        <p className="text-muted-foreground text-sm">Voice session not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <VoiceAgentNav />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Session details</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{session.language}</Badge>
            <Badge variant="secondary">{session.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Staff:</span> {session.staffName ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Customer:</span> {session.customerName ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Started:</span>{" "}
            {new Date(session.startedAt).toLocaleString()}
          </p>
          {context.permissionsFlags.canManage && session.status !== "COMPLETED" ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {(["PAUSED", "COMPLETED", "CANCELLED"] as const).map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await updateVoiceSessionStatusAction(session.id, status);
                    })
                  }
                >
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {context.permissionsFlags.canExecute &&
      (session.status === "ACTIVE" || session.status === "PAUSED") ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Process voice command</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Enter text to simulate voice input. STT providers plug in via the speech abstraction
              layer.
            </p>
            <form
              className="flex flex-wrap gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!commandText.trim()) return;
                startTransition(async () => {
                  const result = await processVoiceCommandAction(session.id, commandText.trim());
                  setLastResponse(result.responseText);
                  setCommandText("");
                });
              }}
            >
              <Input
                value={commandText}
                onChange={(event) => setCommandText(event.target.value)}
                placeholder="e.g. Show today's sales"
                className="max-w-md"
                aria-label="Voice command text"
              />
              <Button type="submit" disabled={isPending}>
                {isPending ? "Processing…" : "Process command"}
              </Button>
            </form>
            {lastResponse ? (
              <p className="bg-muted/50 rounded border p-3 text-sm">{lastResponse}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Command history ({commands.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {commands.length === 0 ? (
            <p className="text-muted-foreground text-sm">No commands in this session.</p>
          ) : (
            <ul className="space-y-3">
              {commands.map((command) => (
                <li key={command.id} className="rounded border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{command.command}</p>
                    <div className="flex gap-2">
                      <Badge variant="outline">{command.intent ?? "unknown"}</Badge>
                      <Badge variant="secondary">{command.status}</Badge>
                      <Badge variant="outline">{formatConfidence(command.confidenceScore)}</Badge>
                    </div>
                  </div>
                  {command.action ? (
                    <p className="text-muted-foreground mt-1">Action: {command.action}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
