import type { Metadata } from "next";
import { HardDrive } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MediaAnalyticsPanel } from "@/modules/media-platform-management/components/media-analytics-panel";
import { getMediaAnalyticsContext } from "@/modules/media-platform-management/lib/get-media-platform-context";
import { MEDIA_PLATFORM_ROUTES } from "@/modules/media-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Storage Analytics" };
}

export default async function MediaAnalyticsPage() {
  const context = await getMediaAnalyticsContext();

  return (
    <ApplicationPageTemplate
      title="Storage Analytics"
      description="Monitor storage usage and quotas."
      icon={HardDrive}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Media", href: MEDIA_PLATFORM_ROUTES.dashboard() },
        { label: "Analytics" },
      ]}
    >
      <MediaAnalyticsPanel analytics={context.analytics} />
    </ApplicationPageTemplate>
  );
}
