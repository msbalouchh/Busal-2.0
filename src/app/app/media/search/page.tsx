import type { Metadata } from "next";
import { Search } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MediaSearchPanel } from "@/modules/media-platform-management/components/media-search-panel";
import { getMediaSearchContext } from "@/modules/media-platform-management/lib/get-media-platform-context";
import { MEDIA_PLATFORM_ROUTES } from "@/modules/media-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Search Media" };
}

export default async function MediaSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const context = await getMediaSearchContext(q);

  return (
    <ApplicationPageTemplate
      title="Search"
      description="Search files and tags."
      icon={Search}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Media", href: MEDIA_PLATFORM_ROUTES.dashboard() },
        { label: "Search" },
      ]}
    >
      <MediaSearchPanel search={context.search} results={context.results} />
    </ApplicationPageTemplate>
  );
}
