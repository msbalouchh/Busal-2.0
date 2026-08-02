import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { DocumentFoldersPanel } from "@/modules/document-platform-management/components/document-folders-panel";
import { getDocumentFoldersContext } from "@/modules/document-platform-management/lib/get-document-platform-context";
import { DOCUMENT_PLATFORM_ROUTES } from "@/modules/document-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Folders" };
}

export default async function DocumentFoldersPage() {
  const context = await getDocumentFoldersContext();

  return (
    <ApplicationPageTemplate
      title="Folders"
      description="Organize documents in folders."
      icon={FolderOpen}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Documents", href: DOCUMENT_PLATFORM_ROUTES.dashboard() },
        { label: "Folders" },
      ]}
    >
      <DocumentFoldersPanel context={context} folders={context.folders} />
    </ApplicationPageTemplate>
  );
}
