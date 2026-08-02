import type { Metadata } from "next";
import { Images } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MediaLibraryPanel } from "@/modules/media-platform-management/components/media-library-panel";
import { getMediaLibraryContext } from "@/modules/media-platform-management/lib/get-media-platform-context";
import { MEDIA_PLATFORM_ROUTES } from "@/modules/media-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Media Library" };
}

export default async function MediaLibraryPage() {
  const context = await getMediaLibraryContext();

  return (
    <ApplicationPageTemplate
      title="Media Library"
      description="Browse and manage all uploaded files."
      icon={Images}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Media", href: MEDIA_PLATFORM_ROUTES.dashboard() },
        { label: "Library" },
      ]}
    >
      <MediaLibraryPanel context={context} files={context.files} />
    </ApplicationPageTemplate>
  );
}
