import type { Metadata } from "next";

import { StaffOverview } from "@/modules/staff/components/staff-overview";
import { StaffPageHeader } from "@/modules/staff/components/staff-page-header";
import { getStaffModuleContext } from "@/modules/staff/lib/get-staff-context";

export const metadata: Metadata = {
  title: "Staff Overview",
};

export default async function StaffOverviewPage() {
  const { members, roles } = await getStaffModuleContext();

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Staff Overview"
        description="Summary of your team, roles, and permissions configuration."
      />
      <StaffOverview members={members} roles={roles} />
    </div>
  );
}
