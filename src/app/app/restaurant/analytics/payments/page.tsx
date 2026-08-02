import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SubDashboardPanel } from "@/modules/restaurant-analytics-management/components/sub-dashboard-panel";
import { RESTAURANT_ANALYTICS_ROUTES } from "@/modules/restaurant-analytics-management/constants/routes";
import { getPaymentsDashboardContext } from "@/modules/restaurant-analytics-management/lib/get-restaurant-analytics-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface PageProps {
  searchParams: Promise<{ branchId?: string; from?: string; to?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Payments Analytics" };
}

export default async function PaymentsAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await getPaymentsDashboardContext(params.branchId, params.from, params.to);
  const { dashboard } = context;

  return (
    <ApplicationPageTemplate
      title="Payments Analytics"
      description="Payment methods, refunds, and daily revenue."
      icon={BarChart3}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Analytics", href: RESTAURANT_ANALYTICS_ROUTES.dashboard() },
        { label: "Payments" },
      ]}
    >
      <SubDashboardPanel
        context={context}
        basePath={RESTAURANT_ANALYTICS_ROUTES.payments()}
        reportType="PAYMENTS"
        title="Payments Dashboard"
        kpis={dashboard.kpis}
        charts={[
          {
            title: "By payment method",
            data: dashboard.byMethod,
            variant: "bar",
            valueFormatter: (value) => `£${value.toFixed(2)}`,
          },
          {
            title: "Daily revenue",
            data: dashboard.dailyRevenue,
            variant: "line",
            valueFormatter: (value) => `£${value.toFixed(2)}`,
          },
        ]}
      />
    </ApplicationPageTemplate>
  );
}
