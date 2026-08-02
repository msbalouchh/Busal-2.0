import type { Metadata } from "next";
import { Tag } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MediaTagsPanel } from "@/modules/media-platform-management/components/media-tags-panel";
import { getMediaTagsContext } from "@/modules/media-platform-management/lib/get-media-platform-context";
import { MEDIA_PLATFORM_ROUTES } from "@/modules/media-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Tags" };
}

export default async function MediaTagsPage() {
  const context = await getMediaTagsContext();

  return (
    <ApplicationPageTemplate
      title="Tags"
      description="Organize files with tags."
      icon={Tag}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Media", href: MEDIA_PLATFORM_ROUTES.dashboard() },
        { label: "Tags" },
      ]}
    >
      <MediaTagsPanel context={context} tags={context.tags} />
    </ApplicationPageTemplate>
  );
}
