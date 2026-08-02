import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SubDashboardPanel } from "@/modules/restaurant-analytics-management/components/sub-dashboard-panel";
import { RESTAURANT_ANALYTICS_ROUTES } from "@/modules/restaurant-analytics-management/constants/routes";
import { getCustomersDashboardContext } from "@/modules/restaurant-analytics-management/lib/get-restaurant-analytics-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface PageProps {
  searchParams: Promise<{ branchId?: string; from?: string; to?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Customer Analytics" };
}

export default async function CustomersAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await getCustomersDashboardContext(params.branchId, params.from, params.to);
  const { dashboard } = context;

  return (
    <ApplicationPageTemplate
      title="Customer Analytics"
      description="Retention, top spenders, and loyalty activity."
      icon={BarChart3}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Analytics", href: RESTAURANT_ANALYTICS_ROUTES.dashboard() },
        { label: "Customers" },
      ]}
    >
      <SubDashboardPanel
        context={context}
        basePath={RESTAURANT_ANALYTICS_ROUTES.customers()}
        reportType="CUSTOMERS"
        title="Customer Dashboard"
        kpis={[
          ...dashboard.kpis,
          {
            label: "Loyalty earned",
            value: String(dashboard.loyaltyPointsEarned),
          },
          {
            label: "Loyalty redeemed",
            value: String(dashboard.loyaltyPointsRedeemed),
          },
        ]}
        tables={[
          {
            title: "Top spenders",
            headers: ["Customer", "Orders", "Spend"],
            rows: dashboard.topSpenders,
          },
        ]}
      />
    </ApplicationPageTemplate>
  );
}
