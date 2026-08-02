import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { notFound } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { BranchDetailsPanel } from "@/modules/branch-management/components/branch-details-panel";
import { getBranchDetailManagementContext } from "@/modules/branch-management/lib/get-branch-management-context";
import { BRANCH_MANAGEMENT_ROUTES } from "@/modules/branch-management/constants/routes";

interface BranchDetailsPageProps {
  params: Promise<{ branchId: string }>;
}

export async function generateMetadata({ params }: BranchDetailsPageProps): Promise<Metadata> {
  const { branchId } = await params;
  const context = await getBranchDetailManagementContext(branchId);

  return {
    title: context.branch ? context.branch.name : "Branch Details",
  };
}

export default async function BranchDetailsPage({ params }: BranchDetailsPageProps) {
  const { branchId } = await params;
  const context = await getBranchDetailManagementContext(branchId);

  if (!context.branch) {
    notFound();
  }

  return (
    <ApplicationPageTemplate
      title={context.branch.name}
      description="Branch profile and platform actions."
      icon={Building2}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Branches", href: BRANCH_MANAGEMENT_ROUTES.list },
        { label: context.branch.name },
      ]}
    >
      <BranchDetailsPanel context={context} branch={context.branch} />
    </ApplicationPageTemplate>
  );
}
