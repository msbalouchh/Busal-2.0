import type { Metadata } from "next";
import { Users } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { StaffListPanel } from "@/modules/staff-management/components/staff-list-panel";
import { getStaffListContext } from "@/modules/staff-management/lib/get-staff-management-context";
import type { StaffListQuery } from "@/modules/staff-management/types/staff-management-types";

export const metadata: Metadata = {
  title: "Staff",
};

interface StaffPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    branchId?: string;
    department?: string;
    roleId?: string;
    page?: string;
  }>;
}

export default async function ApplicationStaffPage({ searchParams }: StaffPageProps) {
  const params = await searchParams;
  const query: StaffListQuery = {
    search: params.search,
    status: (params.status as StaffListQuery["status"]) ?? "ALL",
    branchId: params.branchId,
    department: params.department,
    roleId: params.roleId,
    page: params.page ? Number(params.page) : 1,
  };
  const context = await getStaffListContext(query);

  return (
    <ApplicationPageTemplate
      title="Staff"
      description="Shared staff management for every business module in Busal OS."
      icon={Users}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Staff" },
      ]}
    >
      <StaffListPanel
        context={context}
        list={context.list}
        initialSearch={params.search ?? ""}
        initialStatus={params.status ?? "ALL"}
        initialBranchId={params.branchId ?? ""}
        initialDepartment={params.department ?? ""}
        initialRoleId={params.roleId ?? ""}
      />
    </ApplicationPageTemplate>
  );
}
