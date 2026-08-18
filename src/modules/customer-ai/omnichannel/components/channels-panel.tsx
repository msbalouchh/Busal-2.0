"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  connectChannelAction,
  disconnectChannelAction,
  testChannelConnectionAction,
  updateChannelAiEnabledAction,
} from "@/modules/customer-ai/omnichannel/actions/channel-actions";
import type { ChannelCapabilityMatrix } from "@/modules/customer-ai/omnichannel/constants/channel-capabilities";
import type { ChannelAiSettings, ChannelConnectionSummary } from "@/modules/customer-ai/omnichannel/types/omnichannel.types";
import type { MessagingChannelDefinition } from "@/modules/customer-ai/channels/messaging-channel-registry";
import type { CustomerAiChannel } from "@/modules/customer-ai/types/customer-ai.types";

interface ChannelRow {
  channel: CustomerAiChannel;
  definition: MessagingChannelDefinition | undefined;
  connection: ChannelConnectionSummary | null;
}

interface ChannelSettingRow {
  channel: CustomerAiChannel;
  settings: ChannelAiSettings;
  capabilities: ChannelCapabilityMatrix;
  definition: MessagingChannelDefinition | undefined;
}

interface ChannelsPanelProps {
  channels: ChannelRow[];
  channelSettings: ChannelSettingRow[];
  canManage: boolean;
}

function statusVariant(status: string | undefined): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "CONNECTED":
      return "default";
    case "PENDING":
      return "secondary";
    case "REQUIRES_REAUTH":
    case "ERROR":
      return "destructive";
    default:
      return "outline";
  }
}

export function ChannelsPanel({ channels, channelSettings, canManage }: ChannelsPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleTest = (connectionId: string) => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const health = await testChannelConnectionAction(connectionId);
        setMessage(health.message);
      } catch (testError) {
        setError(testError instanceof Error ? testError.message : "Test failed");
      }
    });
  };

  const handleDisconnect = (connectionId: string) => {
    startTransition(async () => {
      try {
        await disconnectChannelAction(connectionId);
        setMessage("Channel disconnected.");
      } catch (disconnectError) {
        setError(disconnectError instanceof Error ? disconnectError.message : "Disconnect failed");
      }
    });
  };

  const handleConnectDemo = (channel: CustomerAiChannel) => {
    startTransition(async () => {
      try {
        await connectChannelAction({
          channel,
          provider: channel === "tiktok" ? "TIKTOK" : channel === "whatsapp" ? "TWILIO" : "META",
          externalAccountId: `demo-${channel}-${Date.now()}`,
          displayName: `Demo ${channel}`,
          credentials: {
            provider: channel === "tiktok" ? "TIKTOK" : channel === "whatsapp" ? "TWILIO" : "META",
            verifyToken: `verify_${channel}`,
          },
        });
        setMessage(`${channel} connection saved. Configure provider credentials to go live.`);
      } catch (connectError) {
        setError(connectError instanceof Error ? connectError.message : "Connect failed");
      }
    });
  };

  const handleToggleAi = (connectionId: string, enabled: boolean) => {
    startTransition(async () => {
      try {
        await updateChannelAiEnabledAction(connectionId, enabled);
        setMessage(`AI ${enabled ? "enabled" : "disabled"} for channel.`);
      } catch (toggleError) {
        setError(toggleError instanceof Error ? toggleError.message : "Update failed");
      }
    });
  };

  return (
    <div className="space-y-6">
      {message ? <p className="text-sm text-green-600">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {channels.map((row) => {
          const settings = channelSettings.find((entry) => entry.channel === row.channel);
          const connected = Boolean(row.connection && row.connection.status !== "DISCONNECTED");

          return (
            <Card key={row.channel}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{row.definition?.name ?? row.channel}</CardTitle>
                    <CardDescription>{row.definition?.description}</CardDescription>
                  </div>
                  <Badge variant={connected ? statusVariant(row.connection?.status) : "outline"}>
                    {connected ? row.connection?.status ?? "CONNECTED" : "NOT CONNECTED"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {row.connection ? (
                  <>
                    <p>
                      <span className="text-muted-foreground">Account:</span>{" "}
                      {row.connection.displayName ?? row.connection.externalAccountId}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Webhook:</span>{" "}
                      {row.connection.webhookVerified ? "Verified" : "Pending verification"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Last sync:</span>{" "}
                      {row.connection.lastSyncAt
                        ? new Date(row.connection.lastSyncAt).toLocaleString()
                        : "Never"}
                    </p>
                    {row.connection.lastError ? (
                      <p className="text-destructive">{row.connection.lastError}</p>
                    ) : null}
                    <div className="flex items-center justify-between">
                      <span>AI enabled</span>
                      <Switch
                        checked={row.connection.aiEnabled}
                        disabled={!canManage || isPending}
                        onChange={(event) =>
                          handleToggleAi(row.connection!.id, event.target.checked)
                        }
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handleTest(row.connection!.id)}
                      >
                        Test connection
                      </Button>
                      {canManage ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isPending}
                          onClick={() => handleDisconnect(row.connection!.id)}
                        >
                          Disconnect
                        </Button>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground">
                      Connect this channel to route customer messages through your Busal Customer AI.
                    </p>
                    {row.definition?.requiredCredentials.length ? (
                      <p className="text-muted-foreground text-xs">
                        Requires: {row.definition.requiredCredentials.join(", ")}
                      </p>
                    ) : null}
                    {canManage ? (
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleConnectDemo(row.channel)}
                      >
                        Connect
                      </Button>
                    ) : null}
                  </>
                )}

                {settings ? (
                  <div className="border-t pt-3 text-xs text-muted-foreground">
                    <p>Capabilities: text {settings.capabilities.text ? "✓" : "✗"}, images{" "}
                      {settings.capabilities.images ? "✓" : "✗"}, buttons{" "}
                      {settings.capabilities.buttons ? "✓" : "✗"}
                    </p>
                    <p>Outside hours: {settings.settings.outsideHoursBehavior}</p>
                    <p>Webhook path: {row.definition?.webhookPath ?? "—"}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
