import type { Metadata } from "next";

import { StaffRolesPanel } from "@/modules/staff/components/staff-roles-panel";
import { StaffPageHeader } from "@/modules/staff/components/staff-page-header";
import { getStaffManagementContext } from "@/modules/staff/lib/get-staff-context";

export const metadata: Metadata = {
  title: "Staff Roles",
};

export default async function StaffRolesPage() {
  const { roles, permissionsFlags } = await getStaffManagementContext();

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Roles"
        description="Create, edit, duplicate, and archive custom roles for your team."
      />
      <StaffRolesPanel roles={roles} permissions={permissionsFlags} />
    </div>
  );
}
