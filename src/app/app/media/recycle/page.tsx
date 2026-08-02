import type { Metadata } from "next";
import { Trash2 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MediaRecyclePanel } from "@/modules/media-platform-management/components/media-recycle-panel";
import { getMediaRecycleContext } from "@/modules/media-platform-management/lib/get-media-platform-context";
import { MEDIA_PLATFORM_ROUTES } from "@/modules/media-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Recycle Bin" };
}

export default async function MediaRecyclePage() {
  const context = await getMediaRecycleContext();

  return (
    <ApplicationPageTemplate
      title="Recycle Bin"
      description="Restore or permanently delete files."
      icon={Trash2}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Media", href: MEDIA_PLATFORM_ROUTES.dashboard() },
        { label: "Recycle Bin" },
      ]}
    >
      <MediaRecyclePanel context={context} files={context.files} />
    </ApplicationPageTemplate>
  );
}
