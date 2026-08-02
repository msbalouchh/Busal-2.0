import { Siren } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ControlCenterIncidentItem } from "@/modules/control-center/types/control-center-types";

interface IncidentCardProps {
  incidents: ControlCenterIncidentItem[];
  className?: string;
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function IncidentCard({ incidents, className }: IncidentCardProps) {
  return (
    <Card className={cn(className)} data-component="incident-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Siren className="h-4 w-4" aria-hidden="true" />
          Active Incidents
        </CardTitle>
      </CardHeader>
      <CardContent>
        {incidents.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active incidents reported.</p>
        ) : (
          <ul className="space-y-3" aria-label="Active incidents">
            {incidents.map((incident) => (
              <li key={incident.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="line-clamp-2 text-sm font-medium">{incident.title}</p>
                  <time className="text-muted-foreground text-xs" dateTime={incident.createdAt}>
                    {formatTimestamp(incident.createdAt)}
                  </time>
                </div>
                <Badge variant="destructive">{incident.severity}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
