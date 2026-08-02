import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SavedReportViewPanel } from "@/modules/restaurant-analytics-management/components/saved-report-view-panel";
import { RESTAURANT_ANALYTICS_ROUTES } from "@/modules/restaurant-analytics-management/constants/routes";
import { getSavedReportContext } from "@/modules/restaurant-analytics-management/lib/get-restaurant-analytics-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface PageProps {
  params: Promise<{ reportId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Saved Report" };
}

export default async function SavedReportPage({ params }: PageProps) {
  const { reportId } = await params;
  const context = await getSavedReportContext(reportId);

  return (
    <ApplicationPageTemplate
      title={context.report.name}
      description="Saved custom analytics report."
      icon={BarChart3}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Analytics", href: RESTAURANT_ANALYTICS_ROUTES.dashboard() },
        { label: "Reports", href: RESTAURANT_ANALYTICS_ROUTES.reports() },
        { label: context.report.name },
      ]}
    >
      <SavedReportViewPanel context={context} report={context.report} result={context.result} />
    </ApplicationPageTemplate>
  );
}
