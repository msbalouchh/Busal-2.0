import type { Metadata } from "next";
import { Search } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CommunicationSearchPanel } from "@/modules/communication-platform-management/components/communication-search-panel";
import { getCommunicationSearchContext } from "@/modules/communication-platform-management/lib/get-communication-platform-context";
import { COMMUNICATION_PLATFORM_ROUTES } from "@/modules/communication-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Search Communications" };
}

export default async function CommunicationsSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const context = await getCommunicationSearchContext(q);

  return (
    <ApplicationPageTemplate
      title="Search"
      description="Search messages and templates."
      icon={Search}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Communications", href: COMMUNICATION_PLATFORM_ROUTES.dashboard() },
        { label: "Search" },
      ]}
    >
      <CommunicationSearchPanel search={context.search} results={context.results} />
    </ApplicationPageTemplate>
  );
}
