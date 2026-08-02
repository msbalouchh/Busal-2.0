import type { Metadata } from "next";
import { Settings2 } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { BranchSettingsPanel } from "@/modules/branch-management/components/branch-settings-panel";
import { getBranchDetailManagementContext } from "@/modules/branch-management/lib/get-branch-management-context";
import { BRANCH_MANAGEMENT_ROUTES } from "@/modules/branch-management/constants/routes";

interface BranchSettingsPageProps {
  params: Promise<{ branchId: string }>;
}

export async function generateMetadata({ params }: BranchSettingsPageProps): Promise<Metadata> {
  const { branchId } = await params;
  const context = await getBranchDetailManagementContext(branchId);

  return {
    title: context.branch ? `${context.branch.name} Settings` : "Branch Settings",
  };
}

export default async function BranchSettingsPage({ params }: BranchSettingsPageProps) {
  const { branchId } = await params;
  const context = await getBranchDetailManagementContext(branchId);

  if (!context.branch) {
    notFound();
  }

  if (!context.permissionsFlags.canManageSettings && !context.permissionsFlags.canView) {
    redirect(BRANCH_MANAGEMENT_ROUTES.details(branchId));
  }

  return (
    <ApplicationPageTemplate
      title={`${context.branch.name} Settings`}
      description="Configure branch-level settings shared across Busal OS modules."
      icon={Settings2}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Branches", href: BRANCH_MANAGEMENT_ROUTES.list },
        { label: context.branch.name, href: BRANCH_MANAGEMENT_ROUTES.details(branchId) },
        { label: "Settings" },
      ]}
    >
      <BranchSettingsPanel
        branch={context.branch}
        canEdit={context.permissionsFlags.canManageSettings}
      />
    </ApplicationPageTemplate>
  );
}
