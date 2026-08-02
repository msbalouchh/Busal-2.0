"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { StaffForm } from "@/modules/staff-management/components/staff-form";
import { updateStaffManagementAction } from "@/modules/staff-management/actions/staff-management-actions";
import { STAFF_MANAGEMENT_ROUTES } from "@/modules/staff-management/constants/routes";
import type { StaffManagementInput } from "@/modules/staff-management/types/staff-management-types";
import type { SerializedStaffMember } from "@/modules/staff/types/staff-management-types";
import type { BranchData, RoleData } from "@/services/staff-management.service";

interface EditStaffFormProps {
  member: SerializedStaffMember;
  branches: BranchData[];
  roles: RoleData[];
}

export function EditStaffForm({ member, branches, roles }: EditStaffFormProps) {
  const router = useRouter();

  const handleSubmit = async (input: StaffManagementInput) => {
    await updateStaffManagementAction(member.id, input);
    toast.success("Staff member updated");
    router.push(STAFF_MANAGEMENT_ROUTES.details(member.id));
    router.refresh();
  };

  return (
    <StaffForm
      initialMember={member}
      branches={branches}
      roles={roles}
      submitLabel="Save changes"
      onSubmit={handleSubmit}
    />
  );
}
