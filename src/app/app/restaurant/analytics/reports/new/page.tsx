import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { ReportBuilderPanel } from "@/modules/restaurant-analytics-management/components/report-builder-panel";
import { RESTAURANT_ANALYTICS_ROUTES } from "@/modules/restaurant-analytics-management/constants/routes";
import { getRestaurantAnalyticsContext } from "@/modules/restaurant-analytics-management/lib/get-restaurant-analytics-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface PageProps {
  searchParams: Promise<{ branchId?: string; from?: string; to?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Report Builder" };
}

export default async function ReportBuilderPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await getRestaurantAnalyticsContext(params.branchId, params.from, params.to);

  if (!context.permissionsFlags.canCreateReport) {
    redirect(RESTAURANT_ANALYTICS_ROUTES.reports());
  }

  return (
    <ApplicationPageTemplate
      title="Report Builder"
      description="Build and save custom analytics reports."
      icon={BarChart3}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Analytics", href: RESTAURANT_ANALYTICS_ROUTES.dashboard() },
        { label: "Reports", href: RESTAURANT_ANALYTICS_ROUTES.reports() },
        { label: "New" },
      ]}
    >
      <ReportBuilderPanel context={context} />
    </ApplicationPageTemplate>
  );
}
