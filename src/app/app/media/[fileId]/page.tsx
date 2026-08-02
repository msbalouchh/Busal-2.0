import type { Metadata } from "next";
import { FileImage } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MediaPreviewPanel } from "@/modules/media-platform-management/components/media-preview-panel";
import { getMediaFileDetailContext } from "@/modules/media-platform-management/lib/get-media-platform-context";
import { MEDIA_PLATFORM_ROUTES } from "@/modules/media-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "File Preview" };
}

export default async function MediaFileDetailPage({
  params,
}: {
  params: Promise<{ fileId: string }>;
}) {
  const { fileId } = await params;
  const context = await getMediaFileDetailContext(fileId);

  return (
    <ApplicationPageTemplate
      title={context.file.name}
      description="Preview and manage file."
      icon={FileImage}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Media", href: MEDIA_PLATFORM_ROUTES.dashboard() },
        { label: "Library", href: MEDIA_PLATFORM_ROUTES.library() },
        { label: context.file.name },
      ]}
    >
      <MediaPreviewPanel context={context} file={context.file} preview={context.preview} />
    </ApplicationPageTemplate>
  );
}
