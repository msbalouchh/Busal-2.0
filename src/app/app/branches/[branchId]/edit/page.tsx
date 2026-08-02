import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { EditBranchForm } from "@/modules/branch-management/components/edit-branch-form";
import { getBranchDetailManagementContext } from "@/modules/branch-management/lib/get-branch-management-context";
import { BRANCH_MANAGEMENT_ROUTES } from "@/modules/branch-management/constants/routes";

interface EditBranchPageProps {
  params: Promise<{ branchId: string }>;
}

export async function generateMetadata({ params }: EditBranchPageProps): Promise<Metadata> {
  const { branchId } = await params;
  const context = await getBranchDetailManagementContext(branchId);

  return {
    title: context.branch ? `Edit ${context.branch.name}` : "Edit Branch",
  };
}

export default async function EditBranchPage({ params }: EditBranchPageProps) {
  const { branchId } = await params;
  const context = await getBranchDetailManagementContext(branchId);

  if (!context.branch) {
    notFound();
  }

  if (!context.permissionsFlags.canUpdate) {
    redirect(BRANCH_MANAGEMENT_ROUTES.details(branchId));
  }

  return (
    <ApplicationPageTemplate
      title={`Edit ${context.branch.name}`}
      description="Update branch details and regional settings."
      icon={Building2}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Branches", href: BRANCH_MANAGEMENT_ROUTES.list },
        { label: context.branch.name, href: BRANCH_MANAGEMENT_ROUTES.details(branchId) },
        { label: "Edit" },
      ]}
    >
      <EditBranchForm branch={context.branch} />
    </ApplicationPageTemplate>
  );
}
