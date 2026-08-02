import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { ExecutiveDashboardPanel } from "@/modules/restaurant-analytics-management/components/executive-dashboard-panel";
import { getExecutiveDashboardContext } from "@/modules/restaurant-analytics-management/lib/get-restaurant-analytics-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface AnalyticsPageProps {
  searchParams: Promise<{ branchId?: string; from?: string; to?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Analytics" };
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams;
  const context = await getExecutiveDashboardContext(params.branchId, params.from, params.to);

  return (
    <ApplicationPageTemplate
      title="Analytics & Reporting"
      description="Operational, financial, and performance insights across your restaurant."
      icon={BarChart3}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Analytics" },
      ]}
    >
      <ExecutiveDashboardPanel
        context={context}
        dashboard={context.dashboard}
        widgets={context.widgets}
      />
    </ApplicationPageTemplate>
  );
}
