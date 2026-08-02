"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VoiceAgentNav } from "@/modules/ai-voice-agent-management/components/voice-agent-nav";
import { AI_VOICE_AGENT_ROUTES } from "@/modules/ai-voice-agent-management/constants/routes";
import type {
  VoiceCommandRecord,
  VoiceSessionRecord,
} from "@/modules/ai-voice-agent-management/types/ai-voice-agent-types";

interface VoiceSearchPanelProps {
  search: string;
  results: { sessions: VoiceSessionRecord[]; commands: VoiceCommandRecord[] };
}

export function VoiceSearchPanel({ search, results }: VoiceSearchPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState(search);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <VoiceAgentNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search voice content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(() => {
                const params = new URLSearchParams();
                if (query.trim()) params.set("q", query.trim());
                router.push(`${AI_VOICE_AGENT_ROUTES.search()}?${params.toString()}`);
              });
            }}
          >
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sessions and commands…"
              className="max-w-md"
              aria-label="Search voice content"
            />
            <Button type="submit" disabled={isPending}>
              Search
            </Button>
          </form>

          {search ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-3 text-sm font-medium">Sessions ({results.sessions.length})</p>
                {results.sessions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No matches.</p>
                ) : (
                  <ul className="space-y-2">
                    {results.sessions.map((item) => (
                      <li key={item.id} className="rounded border p-3 text-sm">
                        <p className="font-medium">
                          {item.status} · {item.language}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-3 text-sm font-medium">Commands ({results.commands.length})</p>
                {results.commands.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No matches.</p>
                ) : (
                  <ul className="space-y-2">
                    {results.commands.map((item) => (
                      <li key={item.id} className="rounded border p-3 text-sm">
                        <p className="font-medium">{item.command}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Enter a search term.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
