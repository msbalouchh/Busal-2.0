"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppMarketplaceNav } from "@/modules/app-marketplace-management/components/app-marketplace-nav";
import { updateAppConfigurationAction } from "@/modules/app-marketplace-management/actions/app-marketplace-actions";
import type { AppMarketplaceContext } from "@/modules/app-marketplace-management/lib/get-app-marketplace-context";
import type { InstalledAppRecord } from "@/modules/app-marketplace-management/types/app-marketplace-types";

interface AppMarketplaceSettingsPanelProps {
  context: AppMarketplaceContext;
  installed: InstalledAppRecord;
  configuration: unknown;
}

export function AppMarketplaceSettingsPanel({
  context,
  installed,
  configuration,
}: AppMarketplaceSettingsPanelProps) {
  const initial =
    configuration && typeof configuration === "object"
      ? JSON.stringify(configuration, null, 2)
      : "{}";
  const [configText, setConfigText] = useState(initial);
  const [pending, startTransition] = useTransition();

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const parsed = JSON.parse(configText) as Record<string, unknown>;
      await updateAppConfigurationAction(installed.id, parsed);
    });
  }

  return (
    <div className="space-y-8">
      <AppMarketplaceNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{installed.appName} settings</CardTitle>
        </CardHeader>
        <CardContent>
          {context.permissionsFlags.canUpdate ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="config">Configuration (JSON)</Label>
                <Input
                  id="config"
                  value={configText}
                  onChange={(e) => setConfigText(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={pending}>
                Save configuration
              </Button>
            </form>
          ) : (
            <pre className="bg-muted overflow-auto rounded-md p-4 text-xs">{configText}</pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
