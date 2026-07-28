import type { Metadata } from "next";

import { StaffRolesManager } from "@/modules/staff/components/staff-roles-manager";
import { StaffPageHeader } from "@/modules/staff/components/staff-page-header";
import { getStaffModuleContext } from "@/modules/staff/lib/get-staff-context";

export const metadata: Metadata = {
  title: "Staff Roles",
};

export default async function StaffRolesPage() {
  const { roles } = await getStaffModuleContext();

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Roles"
        description="View system roles and create custom roles for your team."
      />
      <StaffRolesManager roles={roles} />
    </div>
  );
}
