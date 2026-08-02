import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StaffProfileDetail } from "@/modules/staff/components/staff-profile-detail";
import { StaffPageHeader } from "@/modules/staff/components/staff-page-header";
import {
  getStaffManagementContext,
  getStaffProfileContext,
} from "@/modules/staff/lib/get-staff-context";

interface StaffProfilePageProps {
  params: Promise<{ staffId: string }>;
}

export async function generateMetadata({ params }: StaffProfilePageProps): Promise<Metadata> {
  const { staffId } = await params;

  try {
    const { member } = await getStaffProfileContext(staffId);
    return { title: `${member.firstName} ${member.lastName}` };
  } catch {
    return { title: "Staff Profile" };
  }
}

export default async function StaffProfilePage({ params }: StaffProfilePageProps) {
  const { staffId } = await params;

  try {
    const [{ member, activity, permissionsFlags }, { branches, roles }] = await Promise.all([
      getStaffProfileContext(staffId),
      getStaffManagementContext(),
    ]);

    return (
      <div className="space-y-6">
        <StaffPageHeader
          title="Staff Profile"
          description="View and manage personal information, assignments, security, and activity."
        />
        <StaffProfileDetail
          member={member}
          activity={activity}
          branches={branches}
          roles={roles}
          permissions={permissionsFlags}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
