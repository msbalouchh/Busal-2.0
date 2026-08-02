"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { suspendTenantAction } from "@/modules/cloud-platform-management/actions/cloud-platform-actions";
import { CloudPlatformNav } from "@/modules/cloud-platform-management/components/cloud-platform-nav";
import type { CloudPlatformContext } from "@/modules/cloud-platform-management/lib/get-cloud-platform-context";
import type { CloudTenantRecord } from "@/modules/cloud-platform-management/types/cloud-platform-types";

interface CloudTenantsPanelProps {
  context: CloudPlatformContext;
  tenants: CloudTenantRecord[];
}

export function CloudTenantsPanel({ context, tenants }: CloudTenantsPanelProps) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="space-y-8">
      <CloudPlatformNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tenants provisioned.</p>
          ) : (
            <ul className="space-y-3">
              {tenants.map((t) => (
                <li key={t.id} className="rounded-md border p-3 text-sm">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="font-medium">{t.tenantKey}</span>
                    <Badge>{t.status}</Badge>
                    <Badge variant="outline">{t.region}</Badge>
                  </div>
                  {context.permissionsFlags.canManageTenants && t.status !== "SUSPENDED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => startTransition(() => suspendTenantAction(t.id))}
                    >
                      Suspend
                    </Button>
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
