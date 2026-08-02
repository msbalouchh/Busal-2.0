import type { Metadata } from "next";
import { KeyRound } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { EnterpriseIdentityProvidersPanel } from "@/modules/enterprise-platform-management/components/enterprise-identity-providers-panel";
import { getEnterpriseIdentityProvidersContext } from "@/modules/enterprise-platform-management/lib/get-enterprise-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Identity Providers" };
}

export default async function EnterpriseIdentityProvidersPage() {
  const context = await getEnterpriseIdentityProvidersContext();

  return (
    <ApplicationPageTemplate
      title="Identity Providers"
      description="Configure SSO, SAML, OIDC, and LDAP provider frameworks."
      icon={KeyRound}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Enterprise", href: APPLICATION_SHELL_ROUTES.enterprise },
        { label: "Identity Providers" },
      ]}
    >
      <EnterpriseIdentityProvidersPanel
        context={context}
        providers={context.providers}
        organizations={context.organizations}
      />
    </ApplicationPageTemplate>
  );
}
