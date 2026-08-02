"use client";

import { useRouter } from "next/navigation";

import { updateModifierManagementAction } from "@/modules/modifier-management/actions/modifier-management-actions";
import { ModifierForm } from "@/modules/modifier-management/components/modifier-form";
import { MODIFIER_MANAGEMENT_ROUTES } from "@/modules/modifier-management/constants/routes";
import type {
  ModifierManagementInput,
  ModifierManagementRecord,
} from "@/modules/modifier-management/types/modifier-management-types";

interface EditModifierFormProps {
  menuId: string;
  modifierGroup: ModifierManagementRecord;
  disabled?: boolean;
}

export function EditModifierForm({
  menuId,
  modifierGroup,
  disabled = false,
}: EditModifierFormProps) {
  const router = useRouter();

  const handleSubmit = async (input: ModifierManagementInput) => {
    await updateModifierManagementAction(menuId, modifierGroup.id, input);
    router.push(MODIFIER_MANAGEMENT_ROUTES.details(menuId, modifierGroup.id));
    router.refresh();
  };

  return (
    <ModifierForm
      initialModifierGroup={modifierGroup}
      submitLabel="Save changes"
      disabled={disabled}
      onSubmit={handleSubmit}
    />
  );
}
