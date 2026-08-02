"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { StaffForm } from "@/modules/staff-management/components/staff-form";
import { createStaffManagementAction } from "@/modules/staff-management/actions/staff-management-actions";
import { STAFF_MANAGEMENT_ROUTES } from "@/modules/staff-management/constants/routes";
import type { StaffManagementInput } from "@/modules/staff-management/types/staff-management-types";
import type { BranchData, RoleData } from "@/services/staff-management.service";

interface CreateStaffFormProps {
  branches: BranchData[];
  roles: RoleData[];
}

export function CreateStaffForm({ branches, roles }: CreateStaffFormProps) {
  const router = useRouter();

  const handleSubmit = async (input: StaffManagementInput) => {
    const result = await createStaffManagementAction(input);
    toast.success("Staff member created");
    router.push(STAFF_MANAGEMENT_ROUTES.details(result.staffId));
    router.refresh();
  };

  return (
    <StaffForm
      branches={branches}
      roles={roles}
      submitLabel="Create staff member"
      onSubmit={handleSubmit}
    />
  );
}
