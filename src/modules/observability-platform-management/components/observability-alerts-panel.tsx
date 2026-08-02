"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  acknowledgeAlertAction,
  createAlertAction,
  resolveAlertAction,
} from "@/modules/observability-platform-management/actions/observability-platform-actions";
import { ObservabilityPlatformNav } from "@/modules/observability-platform-management/components/observability-platform-nav";
import type { ObservabilityPlatformContext } from "@/modules/observability-platform-management/lib/get-observability-platform-context";
import type { AlertRecord } from "@/modules/observability-platform-management/types/observability-platform-types";

interface ObservabilityAlertsPanelProps {
  context: ObservabilityPlatformContext;
  alerts: AlertRecord[];
}

export function ObservabilityAlertsPanel({ context, alerts }: ObservabilityAlertsPanelProps) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <ObservabilityPlatformNav />

      {context.permissionsFlags.canManageAlerts && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create alert rule</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-wrap gap-2"
              action={(formData) => {
                startTransition(async () => {
                  await createAlertAction({
                    name: String(formData.get("name") ?? ""),
                    condition: String(formData.get("condition") ?? ""),
                    severity: "MEDIUM",
                  });
                });
              }}
            >
              <Input name="name" placeholder="Alert name" required className="max-w-xs" />
              <Input name="condition" placeholder="Condition" className="max-w-sm" />
              <Button type="submit" disabled={pending}>
                Create
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alert center</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No alerts configured.</p>
          ) : (
            <ul className="space-y-3">
              {alerts.map((alert) => (
                <li key={alert.id} className="rounded-md border p-3 text-sm">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-medium">{alert.name}</span>
                    <Badge variant="outline">{alert.severity}</Badge>
                    <Badge>{alert.status}</Badge>
                  </div>
                  {alert.condition && (
                    <p className="text-muted-foreground mb-2">Condition: {alert.condition}</p>
                  )}
                  {context.permissionsFlags.canManageAlerts && alert.status !== "RESOLVED" && (
                    <div className="flex gap-2">
                      {alert.status === "ACTIVE" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => startTransition(() => acknowledgeAlertAction(alert.id))}
                        >
                          Acknowledge
                        </Button>
                      )}
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() => startTransition(() => resolveAlertAction(alert.id))}
                      >
                        Resolve
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
