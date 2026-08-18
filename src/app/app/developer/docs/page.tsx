import type { Metadata } from "next";
import { BookOpen } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { DEVELOPER_PLATFORM_ROUTES } from "@/modules/developer-platform-management/constants/routes";
import { PlatformApiDocs } from "@/modules/platform/components/platform-api-docs";
import { listV1ApiRoutes } from "@/modules/platform/api/v1/router";
import { ALL_PLATFORM_API_SCOPES } from "@/modules/platform/constants/api-scopes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "API Documentation" };
}

export default function DeveloperApiDocsPage() {
  const routes = listV1ApiRoutes();

  return (
    <ApplicationPageTemplate
      title="API Documentation"
      description="Authentication, scopes, endpoints, webhooks, and rate limits for the Busal public API."
      icon={BookOpen}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Developer", href: DEVELOPER_PLATFORM_ROUTES.dashboard() },
        { label: "API Docs" },
      ]}
    >
      <PlatformApiDocs routes={routes} scopes={ALL_PLATFORM_API_SCOPES} />
    </ApplicationPageTemplate>
  );
}
