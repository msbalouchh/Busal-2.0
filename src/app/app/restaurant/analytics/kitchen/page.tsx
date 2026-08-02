import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SubDashboardPanel } from "@/modules/restaurant-analytics-management/components/sub-dashboard-panel";
import { RESTAURANT_ANALYTICS_ROUTES } from "@/modules/restaurant-analytics-management/constants/routes";
import { getKitchenAnalyticsContext } from "@/modules/restaurant-analytics-management/lib/get-restaurant-analytics-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface PageProps {
  searchParams: Promise<{ branchId?: string; from?: string; to?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Kitchen Analytics" };
}

export default async function KitchenAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await getKitchenAnalyticsContext(params.branchId, params.from, params.to);
  const { dashboard } = context;

  return (
    <ApplicationPageTemplate
      title="Kitchen Analytics"
      description="Kitchen order flow, prep times, and status breakdown."
      icon={BarChart3}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Analytics", href: RESTAURANT_ANALYTICS_ROUTES.dashboard() },
        { label: "Kitchen" },
      ]}
    >
      <SubDashboardPanel
        context={context}
        basePath={RESTAURANT_ANALYTICS_ROUTES.kitchen()}
        reportType="KITCHEN"
        title="Kitchen Dashboard"
        kpis={dashboard.kpis}
        charts={[{ title: "Orders by status", data: dashboard.ordersByStatus, variant: "bar" }]}
      />
    </ApplicationPageTemplate>
  );
}
