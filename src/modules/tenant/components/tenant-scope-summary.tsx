"use client";

import { useTenantFoundation } from "@/modules/tenant/hooks/use-tenant-foundation";

interface TenantScopeSummaryProps {
  className?: string;
}

/** Debug / architecture surface showing active tenant selection. */
export function TenantScopeSummary({ className }: TenantScopeSummaryProps) {
  const { tenant, organization, workspace, business, branch } = useTenantFoundation();

  return (
    <div className={className}>
      <p className="text-sm font-medium">{tenant.name}</p>
      <p className="text-muted-foreground text-xs">
        {organization.name} · {workspace.name} · {business.name} · {branch.name}
      </p>
    </div>
  );
}
