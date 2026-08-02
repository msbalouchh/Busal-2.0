import Link from "next/link";

import { COMMERCIAL_PLATFORM_ROUTES } from "@/modules/commercial-platform/constants/commercial-platform";
import { SalesActivitiesList } from "@/modules/sales-crm/components/sales-crm-lists";
import { SalesCrmDashboard } from "@/modules/sales-crm/components/sales-crm-dashboard";
import type { SalesActivityView, SalesDashboardView } from "@/modules/sales-crm/utils/sales-utils";

interface CommercialCrmPanelProps {
  sales: SalesDashboardView;
  crm: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    vipCustomers: number;
  } | null;
  recentActivities: SalesActivityView[];
}

export function CommercialCrmPanel({ sales, crm, recentActivities }: CommercialCrmPanelProps) {
  return (
    <div className="space-y-6">
      <SalesCrmDashboard dashboard={sales} />

      {crm ? (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">Total customers</p>
            <p className="text-2xl font-semibold">{crm.totalCustomers}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">New customers</p>
            <p className="text-2xl font-semibold">{crm.newCustomers}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">Returning customers</p>
            <p className="text-2xl font-semibold">{crm.returningCustomers}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">VIP customers</p>
            <p className="text-2xl font-semibold">{crm.vipCustomers}</p>
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent activities</h2>
          <Link
            href={COMMERCIAL_PLATFORM_ROUTES.salesCrm}
            className="text-primary text-sm hover:underline"
          >
            Open Sales CRM
          </Link>
        </div>
        <SalesActivitiesList activities={recentActivities} />
      </div>
    </div>
  );
}
