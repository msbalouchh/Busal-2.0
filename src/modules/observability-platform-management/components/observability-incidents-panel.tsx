"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  assignIncidentAction,
  createIncidentAction,
  updateIncidentStatusAction,
} from "@/modules/observability-platform-management/actions/observability-platform-actions";
import { ObservabilityPlatformNav } from "@/modules/observability-platform-management/components/observability-platform-nav";
import type { ObservabilityPlatformContext } from "@/modules/observability-platform-management/lib/get-observability-platform-context";
import type { IncidentRecord } from "@/modules/observability-platform-management/types/observability-platform-types";

interface ObservabilityIncidentsPanelProps {
  context: ObservabilityPlatformContext;
  incidents: IncidentRecord[];
}

export function ObservabilityIncidentsPanel({
  context,
  incidents,
}: ObservabilityIncidentsPanelProps) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <ObservabilityPlatformNav />

      {context.permissionsFlags.canManageIncidents && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open incident</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-wrap gap-2"
              action={(formData) => {
                startTransition(async () => {
                  await createIncidentAction({
                    title: String(formData.get("title") ?? ""),
                    description: String(formData.get("description") ?? ""),
                    severity: "MEDIUM",
                  });
                });
              }}
            >
              <Input name="title" placeholder="Incident title" required className="max-w-xs" />
              <Input name="description" placeholder="Description" className="max-w-sm" />
              <Button type="submit" disabled={pending}>
                Create
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Incident center</CardTitle>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <p className="text-muted-foreground text-sm">No incidents recorded.</p>
          ) : (
            <ul className="space-y-3">
              {incidents.map((incident) => (
                <li key={incident.id} className="rounded-md border p-3 text-sm">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-medium">{incident.title}</span>
                    <Badge variant="outline">{incident.severity}</Badge>
                    <Badge>{incident.status}</Badge>
                  </div>
                  {incident.description && (
                    <p className="text-muted-foreground mb-2">{incident.description}</p>
                  )}
                  {context.permissionsFlags.canManageIncidents && incident.status === "OPEN" && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          startTransition(() =>
                            updateIncidentStatusAction(incident.id, "INVESTIGATING"),
                          )
                        }
                      >
                        Investigate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          startTransition(() =>
                            assignIncidentAction(incident.id, context.user.email ?? "owner"),
                          )
                        }
                      >
                        Assign to me
                      </Button>
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          startTransition(() => updateIncidentStatusAction(incident.id, "RESOLVED"))
                        }
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
