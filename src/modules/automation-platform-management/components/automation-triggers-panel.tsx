"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AutomationPlatformNav } from "@/modules/automation-platform-management/components/automation-platform-nav";
import type { AutomationTriggerDefinition } from "@/services/automation-trigger-engine.service";

interface AutomationTriggersPanelProps {
  triggers: AutomationTriggerDefinition[];
}

export function AutomationTriggersPanel({ triggers }: AutomationTriggersPanelProps) {
  return (
    <div className="space-y-8">
      <AutomationPlatformNav />
      <p className="text-muted-foreground text-sm">
        Supported trigger events for business automations.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trigger library ({triggers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {triggers.map((trigger) => (
              <li key={trigger.id} className="rounded border p-3 text-sm">
                <p className="font-medium">{trigger.label}</p>
                <p className="text-muted-foreground text-xs">{trigger.event}</p>
                <p className="text-muted-foreground mt-1 text-xs">{trigger.category}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
