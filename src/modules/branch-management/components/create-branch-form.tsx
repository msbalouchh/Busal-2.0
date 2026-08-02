"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { BranchForm } from "@/modules/branch-management/components/branch-form";
import { createBranchManagementAction } from "@/modules/branch-management/actions/branch-management-actions";
import { BRANCH_MANAGEMENT_ROUTES } from "@/modules/branch-management/constants/routes";
import type { BranchManagementInput } from "@/modules/branch-management/types/branch-management-types";

interface CreateBranchFormProps {
  defaultCountry?: string | null;
  defaultTimezone?: string | null;
  defaultCurrency?: string | null;
}

export function CreateBranchForm({
  defaultCountry,
  defaultTimezone,
  defaultCurrency,
}: CreateBranchFormProps) {
  const router = useRouter();

  const handleSubmit = async (input: BranchManagementInput) => {
    const result = await createBranchManagementAction(input);
    toast.success("Branch created");
    router.push(BRANCH_MANAGEMENT_ROUTES.details(result.branchId));
    router.refresh();
  };

  return (
    <BranchForm
      defaultCountry={defaultCountry}
      defaultTimezone={defaultTimezone}
      defaultCurrency={defaultCurrency}
      submitLabel="Create branch"
      onSubmit={handleSubmit}
    />
  );
}
