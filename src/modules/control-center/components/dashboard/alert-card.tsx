import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ControlCenterAlertItem } from "@/modules/control-center/types/control-center-types";

interface AlertCardProps {
  alerts: ControlCenterAlertItem[];
  className?: string;
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AlertCard({ alerts, className }: AlertCardProps) {
  return (
    <Card className={cn(className)} data-component="alert-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          System Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-muted-foreground text-sm">No open system alerts.</p>
        ) : (
          <ul className="space-y-3" aria-label="System alerts">
            {alerts.map((alert) => (
              <li key={alert.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium">{alert.title}</p>
                  <time className="text-muted-foreground text-xs" dateTime={alert.createdAt}>
                    {formatTimestamp(alert.createdAt)}
                  </time>
                </div>
                <Badge variant="outline">{alert.severity}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
