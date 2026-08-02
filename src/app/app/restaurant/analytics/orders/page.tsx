import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SubDashboardPanel } from "@/modules/restaurant-analytics-management/components/sub-dashboard-panel";
import { RESTAURANT_ANALYTICS_ROUTES } from "@/modules/restaurant-analytics-management/constants/routes";
import { getOrdersDashboardContext } from "@/modules/restaurant-analytics-management/lib/get-restaurant-analytics-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface PageProps {
  searchParams: Promise<{ branchId?: string; from?: string; to?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Orders Analytics" };
}

export default async function OrdersAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await getOrdersDashboardContext(params.branchId, params.from, params.to);
  const { dashboard } = context;

  return (
    <ApplicationPageTemplate
      title="Orders Analytics"
      description="Order volume, peak hours, cancellations, and order types."
      icon={BarChart3}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Analytics", href: RESTAURANT_ANALYTICS_ROUTES.dashboard() },
        { label: "Orders" },
      ]}
    >
      <SubDashboardPanel
        context={context}
        basePath={RESTAURANT_ANALYTICS_ROUTES.orders()}
        reportType="ORDERS"
        title="Orders Dashboard"
        kpis={dashboard.kpis}
        charts={[
          { title: "Peak hours", data: dashboard.ordersByHour, variant: "bar" },
          { title: "Orders by type", data: dashboard.ordersByType, variant: "bar" },
          { title: "Orders by day", data: dashboard.ordersByDay, variant: "line" },
        ]}
      />
    </ApplicationPageTemplate>
  );
}
