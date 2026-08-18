"use client";

import { useEffect, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeveloperPlatformNav } from "@/modules/developer-platform-management/components/developer-platform-nav";
import { WEBHOOK_EVENT_OPTIONS } from "@/modules/developer-platform-management/constants/routes";
import {
  createWebhookAction,
  deleteWebhookAction,
  disableWebhookAction,
  listWebhookDeliveriesAction,
  replayWebhookDeliveryAction,
} from "@/modules/developer-platform-management/actions/developer-platform-actions";
import type { DeveloperPlatformContext } from "@/modules/developer-platform-management/lib/get-developer-platform-context";
import type {
  ApiApplicationRecord,
  WebhookSubscriptionRecord,
} from "@/modules/developer-platform-management/types/developer-platform-types";

interface WebhookDeliveryRecord {
  id: string;
  event: string;
  endpoint: string;
  status: string;
  statusCode: number | null;
  attemptCount: number;
  errorMessage: string | null;
  deliveryId: string;
  createdAt: string;
  nextRetryAt: string | null;
}

interface DeveloperWebhooksPanelProps {
  context: DeveloperPlatformContext;
  webhooks: WebhookSubscriptionRecord[];
  applications: ApiApplicationRecord[];
}

export function DeveloperWebhooksPanel({
  context,
  webhooks,
  applications,
}: DeveloperWebhooksPanelProps) {
  const [event, setEvent] = useState(WEBHOOK_EVENT_OPTIONS[0]);
  const [endpoint, setEndpoint] = useState("https://example.com/webhooks/busal");
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDeliveryRecord[]>([]);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const applicationId = applications[0]?.id ?? "";
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    void listWebhookDeliveriesAction(50)
      .then((records) => setDeliveries(records as WebhookDeliveryRecord[]))
      .catch((error: unknown) => {
        setDeliveryError(error instanceof Error ? error.message : "Unable to load delivery history");
      });
  }, []);

  function refreshDeliveries() {
    void listWebhookDeliveriesAction(50)
      .then((records) => setDeliveries(records as WebhookDeliveryRecord[]))
      .catch((error: unknown) => {
        setDeliveryError(error instanceof Error ? error.message : "Unable to load delivery history");
      });
  }

  function handleCreate(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    if (!applicationId) return;
    startTransition(async () => {
      const result = await createWebhookAction({ applicationId, event, endpoint });
      if (result?.secret) {
        setCreatedSecret(result.secret);
      }
    });
  }

  function handleReplay(deliveryId: string) {
    startTransition(async () => {
      setDeliveryError(null);
      try {
        await replayWebhookDeliveryAction(deliveryId);
        refreshDeliveries();
      } catch (error) {
        setDeliveryError(error instanceof Error ? error.message : "Replay failed");
      }
    });
  }

  return (
    <div className="space-y-8">
      <DeveloperPlatformNav />

      {context.permissionsFlags.canCreate && applications.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create webhook</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="webhook-event">Event</Label>
                <select
                  id="webhook-event"
                  className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                  value={event}
                  onChange={(eventTarget) => setEvent(eventTarget.target.value as typeof event)}
                >
                  {WEBHOOK_EVENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="webhook-endpoint">Endpoint</Label>
                <Input
                  id="webhook-endpoint"
                  value={endpoint}
                  onChange={(eventTarget) => setEndpoint(eventTarget.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={pending} className="sm:w-fit">
                Subscribe
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {createdSecret ? (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">Webhook signing secret</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-2 text-sm">
              Copy this secret now. It will not be shown again.
            </p>
            <code className="bg-muted block overflow-x-auto rounded p-3 text-xs">{createdSecret}</code>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Webhook subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <p className="text-muted-foreground text-sm">No webhooks configured.</p>
          ) : (
            <ul className="space-y-3">
              {webhooks.map((webhook) => (
                <li
                  key={webhook.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{webhook.event}</p>
                    <p className="text-muted-foreground text-xs">{webhook.endpoint}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{webhook.status}</Badge>
                    {context.permissionsFlags.canUpdate ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => disableWebhookAction(webhook.id)}
                      >
                        Disable
                      </Button>
                    ) : null}
                    {context.permissionsFlags.canDelete ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteWebhookAction(webhook.id)}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Delivery history</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={refreshDeliveries}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {deliveryError ? (
            <p className="text-destructive mb-3 text-sm" role="alert">
              {deliveryError}
            </p>
          ) : null}

          {deliveries.length === 0 ? (
            <p className="text-muted-foreground text-sm">No webhook deliveries recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {deliveries.map((delivery) => (
                <li key={delivery.id} className="rounded border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{delivery.event}</p>
                      <p className="text-muted-foreground text-xs">{delivery.endpoint}</p>
                    </div>
                    <Badge variant="secondary">{delivery.status}</Badge>
                  </div>
                  <div className="text-muted-foreground mt-2 grid gap-1 text-xs sm:grid-cols-2">
                    <span>HTTP {delivery.statusCode ?? "—"}</span>
                    <span>Attempts {delivery.attemptCount}</span>
                    <span>{new Date(delivery.createdAt).toLocaleString()}</span>
                    {delivery.nextRetryAt ? (
                      <span>Next retry {new Date(delivery.nextRetryAt).toLocaleString()}</span>
                    ) : null}
                  </div>
                  {delivery.errorMessage ? (
                    <p className="text-destructive mt-2 text-xs">{delivery.errorMessage}</p>
                  ) : null}
                  {context.permissionsFlags.canUpdate &&
                  (delivery.status === "failed" || delivery.status === "retrying") ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      disabled={pending}
                      onClick={() => handleReplay(delivery.deliveryId)}
                    >
                      Replay
                    </Button>
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
