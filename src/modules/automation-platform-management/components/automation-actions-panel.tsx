"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AutomationPlatformNav } from "@/modules/automation-platform-management/components/automation-platform-nav";
import type { AutomationActionDefinition } from "@/services/automation-action-engine.service";

interface AutomationActionsPanelProps {
  actions: AutomationActionDefinition[];
}

export function AutomationActionsPanel({ actions }: AutomationActionsPanelProps) {
  return (
    <div className="space-y-8">
      <AutomationPlatformNav />
      <p className="text-muted-foreground text-sm">
        Supported actions — simulated only, no external API calls.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Action library ({actions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {actions.map((action) => (
              <li key={action.id} className="rounded border p-3 text-sm">
                <p className="font-medium">{action.label}</p>
                <p className="text-muted-foreground text-xs">{action.id}</p>
                <p className="text-muted-foreground mt-1 text-xs">{action.category}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
