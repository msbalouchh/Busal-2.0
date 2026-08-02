import type { Metadata } from "next";
import { History } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { DocumentVersionsPanel } from "@/modules/document-platform-management/components/document-versions-panel";
import { getDocumentVersionsContext } from "@/modules/document-platform-management/lib/get-document-platform-context";
import { DOCUMENT_PLATFORM_ROUTES } from "@/modules/document-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Version History" };
}

export default async function DocumentVersionsPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const context = await getDocumentVersionsContext(documentId);

  return (
    <ApplicationPageTemplate
      title="Version History"
      description={`Versions for ${context.document.name}`}
      icon={History}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Documents", href: DOCUMENT_PLATFORM_ROUTES.dashboard() },
        { label: context.document.name, href: DOCUMENT_PLATFORM_ROUTES.documentDetail(documentId) },
        { label: "Versions" },
      ]}
    >
      <DocumentVersionsPanel document={context.document} versions={context.versions} />
    </ApplicationPageTemplate>
  );
}
