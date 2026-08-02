"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatConfidence } from "@/modules/ai-voice-agent-management/lib/ai-voice-agent-validation";
import { VoiceAgentNav } from "@/modules/ai-voice-agent-management/components/voice-agent-nav";
import type {
  VoiceCommandRecord,
  VoiceIntentDefinition,
} from "@/modules/ai-voice-agent-management/types/ai-voice-agent-types";

interface VoiceCommandsPanelProps {
  commands: { items: VoiceCommandRecord[]; total: number };
  intents: VoiceIntentDefinition[];
}

export function VoiceCommandsPanel({ commands, intents }: VoiceCommandsPanelProps) {
  return (
    <div className="space-y-8">
      <VoiceAgentNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Intent viewer</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2">
            {intents.map((intent) => (
              <li key={intent.intent} className="rounded border p-3 text-sm">
                <p className="font-medium">{intent.label}</p>
                <p className="text-muted-foreground mt-1">{intent.description}</p>
                <p className="text-muted-foreground mt-1 text-xs">{intent.exampleCommands[0]}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Command history ({commands.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {commands.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">No voice commands found.</p>
          ) : (
            <ul className="space-y-3">
              {commands.items.map((command) => (
                <li key={command.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{command.command}</p>
                      {command.action ? (
                        <p className="text-muted-foreground mt-1 text-sm">
                          Action: {command.action}
                        </p>
                      ) : null}
                      <p className="text-muted-foreground mt-1 text-xs">
                        {new Date(command.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{command.intent ?? "unknown"}</Badge>
                      <Badge variant="secondary">{command.status}</Badge>
                      <Badge variant="outline">{formatConfidence(command.confidenceScore)}</Badge>
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
