"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { BranchForm } from "@/modules/branch-management/components/branch-form";
import { updateBranchManagementAction } from "@/modules/branch-management/actions/branch-management-actions";
import { BRANCH_MANAGEMENT_ROUTES } from "@/modules/branch-management/constants/routes";
import type {
  BranchManagementInput,
  BranchManagementRecord,
} from "@/modules/branch-management/types/branch-management-types";

interface EditBranchFormProps {
  branch: BranchManagementRecord;
}

export function EditBranchForm({ branch }: EditBranchFormProps) {
  const router = useRouter();

  const handleSubmit = async (input: BranchManagementInput) => {
    await updateBranchManagementAction(branch.id, input);
    toast.success("Branch updated");
    router.push(BRANCH_MANAGEMENT_ROUTES.details(branch.id));
    router.refresh();
  };

  return <BranchForm initialBranch={branch} submitLabel="Save changes" onSubmit={handleSubmit} />;
}
