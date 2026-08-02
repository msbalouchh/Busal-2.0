import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SubDashboardPanel } from "@/modules/restaurant-analytics-management/components/sub-dashboard-panel";
import { RESTAURANT_ANALYTICS_ROUTES } from "@/modules/restaurant-analytics-management/constants/routes";
import { getSalesDashboardContext } from "@/modules/restaurant-analytics-management/lib/get-restaurant-analytics-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface PageProps {
  searchParams: Promise<{ branchId?: string; from?: string; to?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Sales Analytics" };
}

export default async function SalesAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await getSalesDashboardContext(params.branchId, params.from, params.to);
  const { dashboard } = context;

  return (
    <ApplicationPageTemplate
      title="Sales Analytics"
      description="Revenue trends, tax, discounts, and profit overview."
      icon={BarChart3}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Analytics", href: RESTAURANT_ANALYTICS_ROUTES.dashboard() },
        { label: "Sales" },
      ]}
    >
      <SubDashboardPanel
        context={context}
        basePath={RESTAURANT_ANALYTICS_ROUTES.sales()}
        reportType="SALES"
        title="Sales Dashboard"
        kpis={dashboard.kpis}
        charts={[
          {
            title: "Revenue trend",
            data: dashboard.revenueTrend,
            variant: "line",
            valueFormatter: (value) => `£${value.toFixed(2)}`,
          },
          {
            title: "Gross vs net",
            data: dashboard.grossVsNet,
            variant: "bar",
            valueFormatter: (value) => `£${value.toFixed(2)}`,
          },
        ]}
      />
    </ApplicationPageTemplate>
  );
}
