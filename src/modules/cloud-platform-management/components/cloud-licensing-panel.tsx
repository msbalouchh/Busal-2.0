"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudPlatformNav } from "@/modules/cloud-platform-management/components/cloud-platform-nav";
import type {
  CloudTenantRecord,
  LicenseRecord,
} from "@/modules/cloud-platform-management/types/cloud-platform-types";

interface CloudLicensingPanelProps {
  license: LicenseRecord;
  tenant: CloudTenantRecord | null;
}

export function CloudLicensingPanel({ license, tenant }: CloudLicensingPanelProps) {
  return (
    <div className="space-y-8">
      <CloudPlatformNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">License validation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Status:{" "}
            <Badge variant={license.valid ? "default" : "destructive"}>
              {license.valid ? "Valid" : "Invalid"}
            </Badge>
          </p>
          <p>Plan: {license.planSlug ?? "—"}</p>
          <p>Subscription: {license.subscriptionStatus ?? "—"}</p>
          <p className="font-mono text-xs break-all">Key: {license.licenseKey || "—"}</p>
          {tenant && <p>Tenant: {tenant.tenantKey}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
