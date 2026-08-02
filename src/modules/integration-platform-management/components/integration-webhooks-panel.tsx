"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createIntegrationWebhookAction,
  deleteIntegrationWebhookAction,
  toggleIntegrationWebhookAction,
} from "@/modules/integration-platform-management/actions/integration-platform-actions";
import { IntegrationPlatformNav } from "@/modules/integration-platform-management/components/integration-platform-nav";
import type { IntegrationPlatformContext } from "@/modules/integration-platform-management/lib/get-integration-platform-context";
import type {
  IntegrationProviderRecord,
  IntegrationWebhookRecord,
} from "@/modules/integration-platform-management/types/integration-platform-types";

interface IntegrationWebhooksPanelProps {
  context: IntegrationPlatformContext;
  webhooks: IntegrationWebhookRecord[];
  providers: IntegrationProviderRecord[];
}

export function IntegrationWebhooksPanel({
  context,
  webhooks,
  providers,
}: IntegrationWebhooksPanelProps) {
  const [providerId, setProviderId] = useState(providers[0]?.id ?? "");
  const [event, setEvent] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <IntegrationPlatformNav />

      {context.permissionsFlags.canCreate ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Register webhook</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(formEvent) => {
                formEvent.preventDefault();
                startTransition(async () => {
                  await createIntegrationWebhookAction({ providerId, event, endpoint });
                  setEvent("");
                  setEndpoint("");
                });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="webhook-provider">Provider</Label>
                <select
                  id="webhook-provider"
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook-event">Event</Label>
                <Input
                  id="webhook-event"
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="webhook-endpoint">Endpoint</Label>
                <Input
                  id="webhook-endpoint"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://your-app.example/webhooks/buslos"
                  required
                />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : "Add webhook"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Webhooks ({webhooks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <p className="text-muted-foreground text-sm">No webhooks configured.</p>
          ) : (
            <ul className="space-y-3">
              {webhooks.map((webhook) => (
                <li key={webhook.id} className="rounded border p-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{webhook.providerName}</p>
                      <p className="text-muted-foreground">{webhook.event}</p>
                      <p className="text-muted-foreground mt-1 break-all">{webhook.endpoint}</p>
                    </div>
                    <Badge variant="secondary">{webhook.status}</Badge>
                  </div>
                  {context.permissionsFlags.canUpdate || context.permissionsFlags.canDelete ? (
                    <div className="mt-3 flex gap-2">
                      {context.permissionsFlags.canUpdate ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() =>
                            startTransition(async () => {
                              await toggleIntegrationWebhookAction(
                                webhook.id,
                                webhook.status !== "ACTIVE",
                              );
                            })
                          }
                        >
                          {webhook.status === "ACTIVE" ? "Disable" : "Enable"}
                        </Button>
                      ) : null}
                      {context.permissionsFlags.canDelete ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isPending}
                          onClick={() =>
                            startTransition(async () => {
                              await deleteIntegrationWebhookAction(webhook.id);
                            })
                          }
                        >
                          Delete
                        </Button>
                      ) : null}
                    </div>
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
