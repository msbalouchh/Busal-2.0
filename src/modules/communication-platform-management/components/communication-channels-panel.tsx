"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCommunicationChannelAction,
  deleteCommunicationChannelAction,
} from "@/modules/communication-platform-management/actions/communication-platform-actions";
import { CommunicationPlatformNav } from "@/modules/communication-platform-management/components/communication-platform-nav";
import { CHANNEL_TYPE_OPTIONS } from "@/modules/communication-platform-management/constants/routes";
import type { CommunicationPlatformContext } from "@/modules/communication-platform-management/lib/get-communication-platform-context";
import type {
  CommunicationChannelRecord,
  CommunicationProviderRecord,
} from "@/modules/communication-platform-management/types/communication-platform-types";

interface CommunicationChannelsPanelProps {
  context: CommunicationPlatformContext;
  channels: CommunicationChannelRecord[];
  providers: CommunicationProviderRecord[];
}

export function CommunicationChannelsPanel({
  context,
  channels,
  providers,
}: CommunicationChannelsPanelProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof CHANNEL_TYPE_OPTIONS)[number]["value"]>("EMAIL");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <CommunicationPlatformNav />

      {context.permissionsFlags.canCreate ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add channel</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid max-w-xl gap-4"
              onSubmit={(formEvent) => {
                formEvent.preventDefault();
                startTransition(async () => {
                  await createCommunicationChannelAction({ name, type });
                  setName("");
                });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="channel-name">Name</Label>
                <Input
                  id="channel-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel-type">Type</Label>
                <select
                  id="channel-type"
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as (typeof CHANNEL_TYPE_OPTIONS)[number]["value"])
                  }
                  className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                >
                  {CHANNEL_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={isPending}>
                Create channel
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Channels ({channels.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {channels.map((channel) => (
                <li
                  key={channel.id}
                  className="flex items-center justify-between rounded border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{channel.name}</p>
                    <Badge variant="outline">{channel.type}</Badge>
                  </div>
                  {context.permissionsFlags.canDelete ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await deleteCommunicationChannelAction(channel.id);
                        })
                      }
                    >
                      Delete
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Channel providers</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {providers.map((provider) => (
                <li key={provider.id} className="rounded border p-3">
                  <p className="font-medium">{provider.name}</p>
                  <p className="text-muted-foreground text-xs">{provider.channelType}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
