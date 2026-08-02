import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MediaFoldersPanel } from "@/modules/media-platform-management/components/media-folders-panel";
import { getMediaFoldersContext } from "@/modules/media-platform-management/lib/get-media-platform-context";
import { MEDIA_PLATFORM_ROUTES } from "@/modules/media-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Folders" };
}

export default async function MediaFoldersPage() {
  const context = await getMediaFoldersContext();

  return (
    <ApplicationPageTemplate
      title="Folders"
      description="Organize media files in folders."
      icon={FolderOpen}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Media", href: MEDIA_PLATFORM_ROUTES.dashboard() },
        { label: "Folders" },
      ]}
    >
      <MediaFoldersPanel context={context} folders={context.folders} />
    </ApplicationPageTemplate>
  );
}
