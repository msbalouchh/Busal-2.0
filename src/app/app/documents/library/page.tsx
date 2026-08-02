import type { Metadata } from "next";
import { Files } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { DocumentLibraryPanel } from "@/modules/document-platform-management/components/document-library-panel";
import { getDocumentLibraryContext } from "@/modules/document-platform-management/lib/get-document-platform-context";
import { DOCUMENT_PLATFORM_ROUTES } from "@/modules/document-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Document Library" };
}

export default async function DocumentLibraryPage() {
  const context = await getDocumentLibraryContext();

  return (
    <ApplicationPageTemplate
      title="Document Library"
      description="Browse and manage all business documents."
      icon={Files}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Documents", href: DOCUMENT_PLATFORM_ROUTES.dashboard() },
        { label: "Library" },
      ]}
    >
      <DocumentLibraryPanel context={context} documents={context.documents} />
    </ApplicationPageTemplate>
  );
}
