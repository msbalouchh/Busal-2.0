import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ControlCenterTenantSummary } from "@/modules/control-center/types/control-center-types";

interface TenantSummaryCardProps {
  tenants: ControlCenterTenantSummary[];
  className?: string;
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}

export function TenantSummaryCard({ tenants, className }: TenantSummaryCardProps) {
  return (
    <Card className={cn(className)} data-component="tenant-summary-card">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Tenant Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {tenants.length === 0 ? (
          <p className="text-muted-foreground text-sm">No tenant records available.</p>
        ) : (
          <ul className="space-y-3" aria-label="Tenant summaries">
            {tenants.map((tenant) => (
              <li
                key={tenant.id}
                className="flex flex-col gap-2 border-b pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium">{tenant.businessName}</p>
                  <p className="text-muted-foreground text-xs">
                    {tenant.subscriptionPlan ?? "No plan"} · Joined{" "}
                    {formatTimestamp(tenant.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{tenant.lifecycleStatus}</Badge>
                  <Badge variant={tenant.healthStatus === "HEALTHY" ? "secondary" : "destructive"}>
                    {tenant.healthStatus}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
