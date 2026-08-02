import type { Metadata } from "next";
import { ImageIcon } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MediaDashboardPanel } from "@/modules/media-platform-management/components/media-dashboard-panel";
import { getMediaDashboardContext } from "@/modules/media-platform-management/lib/get-media-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Media" };
}

export default async function MediaDashboardPage() {
  const context = await getMediaDashboardContext();

  return (
    <ApplicationPageTemplate
      title="Media"
      description="Centralized file and media management for your business."
      icon={ImageIcon}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Media" },
      ]}
    >
      <MediaDashboardPanel
        context={context}
        summary={context.summary}
        recentFiles={context.recentFiles}
      />
    </ApplicationPageTemplate>
  );
}
