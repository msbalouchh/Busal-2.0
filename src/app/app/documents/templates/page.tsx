import type { Metadata } from "next";
import { LayoutTemplate } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { DocumentTemplatesPanel } from "@/modules/document-platform-management/components/document-templates-panel";
import { getDocumentTemplatesContext } from "@/modules/document-platform-management/lib/get-document-platform-context";
import { DOCUMENT_PLATFORM_ROUTES } from "@/modules/document-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Templates" };
}

export default async function DocumentTemplatesPage() {
  const context = await getDocumentTemplatesContext();

  return (
    <ApplicationPageTemplate
      title="Templates"
      description="Create reusable document templates."
      icon={LayoutTemplate}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Documents", href: DOCUMENT_PLATFORM_ROUTES.dashboard() },
        { label: "Templates" },
      ]}
    >
      <DocumentTemplatesPanel context={context} templates={context.templates} />
    </ApplicationPageTemplate>
  );
}
