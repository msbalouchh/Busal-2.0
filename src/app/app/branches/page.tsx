import type { Metadata } from "next";
import { Building2 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { BranchesListPanel } from "@/modules/branch-management/components/branches-list-panel";
import { getBranchListContext } from "@/modules/branch-management/lib/get-branch-management-context";
import type { BranchListQuery } from "@/modules/branch-management/types/branch-management-types";

export const metadata: Metadata = {
  title: "Branches",
};

interface BranchesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    type?: string;
    page?: string;
  }>;
}

export default async function ApplicationBranchesPage({ searchParams }: BranchesPageProps) {
  const params = await searchParams;
  const query: BranchListQuery = {
    search: params.search,
    status: (params.status as BranchListQuery["status"]) ?? "ALL",
    type: (params.type as BranchListQuery["type"]) ?? "ALL",
    page: params.page ? Number(params.page) : 1,
  };
  const context = await getBranchListContext(query);

  return (
    <ApplicationPageTemplate
      title="Branches"
      description="Central location management for every industry module in Busal OS."
      icon={Building2}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Branches" },
      ]}
    >
      <BranchesListPanel
        context={context}
        list={context.list}
        initialSearch={params.search ?? ""}
        initialStatus={params.status ?? "ALL"}
        initialType={params.type ?? "ALL"}
      />
    </ApplicationPageTemplate>
  );
}
