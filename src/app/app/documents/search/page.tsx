import type { Metadata } from "next";
import { Search } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { DocumentSearchPanel } from "@/modules/document-platform-management/components/document-search-panel";
import { getDocumentSearchContext } from "@/modules/document-platform-management/lib/get-document-platform-context";
import { DOCUMENT_PLATFORM_ROUTES } from "@/modules/document-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Search Documents" };
}

export default async function DocumentSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const context = await getDocumentSearchContext(q);

  return (
    <ApplicationPageTemplate
      title="Search"
      description="Search documents and templates."
      icon={Search}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Documents", href: DOCUMENT_PLATFORM_ROUTES.dashboard() },
        { label: "Search" },
      ]}
    >
      <DocumentSearchPanel search={context.search} results={context.results} />
    </ApplicationPageTemplate>
  );
}
