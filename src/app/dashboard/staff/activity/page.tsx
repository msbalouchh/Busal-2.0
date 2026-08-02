import type { Metadata } from "next";

import { StaffActivityTimeline } from "@/modules/staff/components/staff-activity-timeline";
import { StaffPageHeader } from "@/modules/staff/components/staff-page-header";
import { getStaffManagementContext } from "@/modules/staff/lib/get-staff-context";

export const metadata: Metadata = {
  title: "Staff Activity",
};

export default async function StaffActivityPage() {
  const { auditLogs } = await getStaffManagementContext();

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Staff Activity"
        description="Audit timeline for staff changes, invitations, roles, and security events."
      />
      <StaffActivityTimeline entries={auditLogs} title="Recent activity" />
    </div>
  );
}
