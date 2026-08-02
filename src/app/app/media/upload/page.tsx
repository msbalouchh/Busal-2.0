import type { Metadata } from "next";
import { Upload } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MediaUploadPanel } from "@/modules/media-platform-management/components/media-upload-panel";
import { getMediaUploadContext } from "@/modules/media-platform-management/lib/get-media-platform-context";
import { MEDIA_PLATFORM_ROUTES } from "@/modules/media-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Upload Center" };
}

export default async function MediaUploadPage() {
  const context = await getMediaUploadContext();

  return (
    <ApplicationPageTemplate
      title="Upload Center"
      description="Upload files individually or in bulk."
      icon={Upload}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Media", href: MEDIA_PLATFORM_ROUTES.dashboard() },
        { label: "Upload" },
      ]}
    >
      <MediaUploadPanel context={context} recentUploads={context.recentUploads} />
    </ApplicationPageTemplate>
  );
}
