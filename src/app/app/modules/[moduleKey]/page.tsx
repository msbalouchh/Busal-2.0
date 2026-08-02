import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { ModuleDetailsPanel } from "@/modules/business-modules/components/module-details-panel";
import { resolveIndustryModuleIcon } from "@/modules/business-modules/constants/module-icons";
import { BUSINESS_MODULE_ROUTES } from "@/modules/business-modules/constants/routes";
import { getBusinessModuleDetailsContext } from "@/modules/business-modules/lib/get-business-modules-context";

interface ModuleDetailsPageProps {
  params: Promise<{ moduleKey: string }>;
}

export async function generateMetadata({ params }: ModuleDetailsPageProps): Promise<Metadata> {
  const { moduleKey } = await params;
  const context = await getBusinessModuleDetailsContext(moduleKey);

  return {
    title: context ? `${context.definition.displayName} Module` : "Module Details",
  };
}

export default async function ApplicationModuleDetailsPage({ params }: ModuleDetailsPageProps) {
  const { moduleKey } = await params;
  const context = await getBusinessModuleDetailsContext(moduleKey);

  if (!context) {
    notFound();
  }

  const Icon = resolveIndustryModuleIcon(context.definition.iconKey);

  return (
    <ApplicationPageTemplate
      title={context.definition.displayName}
      description={context.definition.description}
      icon={Icon}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Modules", href: BUSINESS_MODULE_ROUTES.dashboard },
        { label: context.definition.displayName },
      ]}
    >
      <ModuleDetailsPanel context={context} />
    </ApplicationPageTemplate>
  );
}
