"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateRegionAction } from "@/modules/cloud-platform-management/actions/cloud-platform-actions";
import { CloudPlatformNav } from "@/modules/cloud-platform-management/components/cloud-platform-nav";
import type { CloudPlatformContext } from "@/modules/cloud-platform-management/lib/get-cloud-platform-context";
import type { CloudSettingsRecord } from "@/modules/cloud-platform-management/types/cloud-platform-types";

interface CloudSettingsPanelProps {
  context: CloudPlatformContext;
  settings: CloudSettingsRecord;
}

const REGIONS = ["eu-west-1", "us-east-1", "ap-southeast-1"];

export function CloudSettingsPanel({ context, settings }: CloudSettingsPanelProps) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="space-y-8">
      <CloudPlatformNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            Tenant key: <span className="font-medium">{settings.tenantKey}</span>
          </p>
          <p>Status: {settings.status}</p>
          <p>Region: {settings.region}</p>
          {context.permissionsFlags.canManage && (
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((region) => (
                <Button
                  key={region}
                  size="sm"
                  variant="outline"
                  disabled={pending || settings.region === region}
                  onClick={() => startTransition(() => updateRegionAction(region))}
                >
                  {region}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
