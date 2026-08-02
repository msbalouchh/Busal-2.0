import type { Metadata } from "next";
import { FileText } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { DocumentDashboardPanel } from "@/modules/document-platform-management/components/document-dashboard-panel";
import { getDocumentDashboardContext } from "@/modules/document-platform-management/lib/get-document-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Documents" };
}

export default async function DocumentsDashboardPage() {
  const context = await getDocumentDashboardContext();

  return (
    <ApplicationPageTemplate
      title="Documents"
      description="Centralized document management for your business."
      icon={FileText}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Documents" },
      ]}
    >
      <DocumentDashboardPanel
        context={context}
        summary={context.summary}
        recentDocuments={context.recentDocuments}
      />
    </ApplicationPageTemplate>
  );
}
