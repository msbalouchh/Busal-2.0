"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeveloperPlatformNav } from "@/modules/developer-platform-management/components/developer-platform-nav";
import { updateDeveloperSettingsAction } from "@/modules/developer-platform-management/actions/developer-platform-actions";
import type { DeveloperPlatformContext } from "@/modules/developer-platform-management/lib/get-developer-platform-context";
import type { DeveloperSettingsRecord } from "@/modules/developer-platform-management/types/developer-platform-types";

interface DeveloperSettingsPanelProps {
  context: DeveloperPlatformContext;
  settings: DeveloperSettingsRecord;
  sdkLanguages: readonly string[];
}

export function DeveloperSettingsPanel({
  context,
  settings,
  sdkLanguages,
}: DeveloperSettingsPanelProps) {
  const [rateLimit, setRateLimit] = useState(String(settings.rateLimitPerMinute));
  const [ipAllowList, setIpAllowList] = useState(settings.ipAllowList.join(", "));
  const [pending, startTransition] = useTransition();

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      await updateDeveloperSettingsAction({
        rateLimitPerMinute: Number(rateLimit),
        ipAllowList: ipAllowList
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
      });
    });
  }

  return (
    <div className="space-y-8">
      <DeveloperPlatformNav />

      {context.permissionsFlags.canManage ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Developer settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="grid max-w-xl gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate-limit">Rate limit (requests/minute)</Label>
                <Input
                  id="rate-limit"
                  type="number"
                  value={rateLimit}
                  onChange={(e) => setRateLimit(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ip-allow">IP allow list (comma-separated)</Label>
                <Input
                  id="ip-allow"
                  value={ipAllowList}
                  onChange={(e) => setIpAllowList(e.target.value)}
                  placeholder="203.0.113.10, 198.51.100.5"
                />
              </div>
              <Button type="submit" disabled={pending} className="w-fit">
                Save settings
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">SDK framework</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-3 text-sm">
            Supported SDK languages (framework only — no generated SDKs).
          </p>
          <ul className="flex flex-wrap gap-2">
            {sdkLanguages.map((language) => (
              <li key={language} className="bg-muted rounded-md px-3 py-1 text-sm">
                {language}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
