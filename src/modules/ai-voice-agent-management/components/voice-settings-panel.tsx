"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SUPPORTED_VOICE_LANGUAGES } from "@/modules/ai-voice-agent-management/lib/ai-voice-agent-validation";
import { updateVoiceSettingsAction } from "@/modules/ai-voice-agent-management/actions/ai-voice-agent-actions";
import { VoiceAgentNav } from "@/modules/ai-voice-agent-management/components/voice-agent-nav";
import type { AiVoiceAgentContext } from "@/modules/ai-voice-agent-management/lib/get-ai-voice-agent-context";
import type { VoiceSettings } from "@/modules/ai-voice-agent-management/types/ai-voice-agent-types";

interface VoiceSettingsPanelProps {
  context: AiVoiceAgentContext;
  settings: VoiceSettings;
  sttProviderId: string;
  ttsProviderId: string;
  sttAvailable: boolean;
  ttsAvailable: boolean;
}

export function VoiceSettingsPanel({
  context,
  settings,
  sttProviderId,
  ttsProviderId,
  sttAvailable,
  ttsAvailable,
}: VoiceSettingsPanelProps) {
  const [language, setLanguage] = useState(settings.defaultLanguage);
  const [voiceEnabled, setVoiceEnabled] = useState(settings.voiceEnabled);
  const [autoRouteIntents, setAutoRouteIntents] = useState(settings.autoRouteIntents);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <VoiceAgentNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Voice settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="voice-language">Default language</Label>
            <select
              id="voice-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 max-w-xs rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {SUPPORTED_VOICE_LANGUAGES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="voice-enabled">Voice enabled</Label>
              <p className="text-muted-foreground text-sm">Allow voice session creation</p>
            </div>
            <input
              id="voice-enabled"
              type="checkbox"
              checked={voiceEnabled}
              onChange={(event) => setVoiceEnabled(event.target.checked)}
              className="h-4 w-4"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="auto-route">Auto-route intents</Label>
              <p className="text-muted-foreground text-sm">
                Automatically map recognized intents to Busal actions
              </p>
            </div>
            <input
              id="auto-route"
              type="checkbox"
              checked={autoRouteIntents}
              onChange={(event) => setAutoRouteIntents(event.target.checked)}
              className="h-4 w-4"
            />
          </div>

          <div className="rounded border p-4 text-sm">
            <p className="font-medium">Speech providers (abstraction layer)</p>
            <p className="text-muted-foreground mt-2">
              STT: {sttProviderId} {sttAvailable ? "(available)" : "(not configured)"}
            </p>
            <p className="text-muted-foreground mt-1">
              TTS: {ttsProviderId} {ttsAvailable ? "(available)" : "(not configured)"}
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              Register providers via VoiceProviderManager when integrating external STT/TTS.
            </p>
          </div>

          {context.permissionsFlags.canManage ? (
            <Button
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await updateVoiceSettingsAction({
                    defaultLanguage: language,
                    voiceEnabled,
                    autoRouteIntents,
                  });
                })
              }
            >
              {isPending ? "Saving…" : "Save settings"}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
