"use client";

import { useState, useTransition } from "react";

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
} from "@/modules/developer-platform-management/actions/developer-platform-actions";
import type { DeveloperPlatformContext } from "@/modules/developer-platform-management/lib/get-developer-platform-context";
import type {
  ApiApplicationRecord,
  WebhookSubscriptionRecord,
} from "@/modules/developer-platform-management/types/developer-platform-types";

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
  const applicationId = applications[0]?.id ?? "";
  const [pending, startTransition] = useTransition();

  function handleCreate(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    if (!applicationId) return;
    startTransition(async () => {
      await createWebhookAction({ applicationId, event, endpoint });
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
                  onChange={(e) => setEvent(e.target.value as typeof event)}
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
                  onChange={(e) => setEndpoint(e.target.value)}
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
    </div>
  );
}
