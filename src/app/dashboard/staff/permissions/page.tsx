import type { Metadata } from "next";

import { PermissionsMatrix } from "@/modules/staff/components/permissions-matrix";
import { StaffPageHeader } from "@/modules/staff/components/staff-page-header";
import { getStaffManagementContext } from "@/modules/staff/lib/get-staff-context";

export const metadata: Metadata = {
  title: "Staff Permissions",
};

export default async function StaffPermissionsPage() {
  const { permissionMatrix } = await getStaffManagementContext();

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Permissions"
        description="Configure role permissions across dashboard, business, staff, and platform modules."
      />
      <PermissionsMatrix matrix={permissionMatrix} />
    </div>
  );
}
