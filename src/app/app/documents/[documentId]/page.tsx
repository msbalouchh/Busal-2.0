import type { Metadata } from "next";
import { FileSearch } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { DocumentViewerPanel } from "@/modules/document-platform-management/components/document-viewer-panel";
import { getDocumentDetailContext } from "@/modules/document-platform-management/lib/get-document-platform-context";
import { DOCUMENT_PLATFORM_ROUTES } from "@/modules/document-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Document Viewer" };
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const context = await getDocumentDetailContext(documentId);

  return (
    <ApplicationPageTemplate
      title={context.document.name}
      description="Preview and manage document."
      icon={FileSearch}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Documents", href: DOCUMENT_PLATFORM_ROUTES.dashboard() },
        { label: "Library", href: DOCUMENT_PLATFORM_ROUTES.library() },
        { label: context.document.name },
      ]}
    >
      <DocumentViewerPanel
        context={context}
        document={context.document}
        preview={context.preview}
      />
    </ApplicationPageTemplate>
  );
}
