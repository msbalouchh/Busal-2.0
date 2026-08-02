"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateOrganizationSettingsAction } from "@/modules/enterprise-platform-management/actions/enterprise-platform-actions";
import { EnterprisePlatformNav } from "@/modules/enterprise-platform-management/components/enterprise-platform-nav";
import type { EnterprisePlatformContext } from "@/modules/enterprise-platform-management/lib/get-enterprise-platform-context";
import type { OrganizationSettingsRecord } from "@/modules/enterprise-platform-management/types/enterprise-platform-types";

interface EnterpriseSettingsPanelProps {
  context: EnterprisePlatformContext;
  settings: OrganizationSettingsRecord;
}

export function EnterpriseSettingsPanel({ context, settings }: EnterpriseSettingsPanelProps) {
  const [pending, startTransition] = useTransition();
  const settingsJson = JSON.stringify(settings.settings, null, 2);

  return (
    <div className="space-y-8">
      <EnterprisePlatformNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{settings.name} — settings</CardTitle>
        </CardHeader>
        <CardContent>
          {context.permissionsFlags.canManage ? (
            <form
              className="space-y-4"
              action={(formData) => {
                startTransition(async () => {
                  const raw = String(formData.get("settings") ?? "{}");
                  let parsed: Record<string, unknown> = {};
                  try {
                    parsed = JSON.parse(raw) as Record<string, unknown>;
                  } catch {
                    parsed = {};
                  }
                  await updateOrganizationSettingsAction(settings.organizationId, parsed);
                });
              }}
            >
              <textarea
                name="settings"
                defaultValue={settingsJson}
                className="border-input bg-background min-h-[200px] w-full rounded-md border p-3 font-mono text-sm"
              />
              <Button type="submit" disabled={pending}>
                Save settings
              </Button>
            </form>
          ) : (
            <pre className="bg-muted overflow-auto rounded-md p-3 text-sm">{settingsJson}</pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
