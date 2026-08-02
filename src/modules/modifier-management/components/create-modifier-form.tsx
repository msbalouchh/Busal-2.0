"use client";

import { useRouter } from "next/navigation";

import { createModifierManagementAction } from "@/modules/modifier-management/actions/modifier-management-actions";
import { ModifierForm } from "@/modules/modifier-management/components/modifier-form";
import { MODIFIER_MANAGEMENT_ROUTES } from "@/modules/modifier-management/constants/routes";
import type { ModifierManagementInput } from "@/modules/modifier-management/types/modifier-management-types";

interface CreateModifierFormProps {
  menuId: string;
  disabled?: boolean;
}

export function CreateModifierForm({ menuId, disabled = false }: CreateModifierFormProps) {
  const router = useRouter();

  const handleSubmit = async (input: ModifierManagementInput) => {
    const result = await createModifierManagementAction(menuId, input);
    router.push(MODIFIER_MANAGEMENT_ROUTES.details(menuId, result.modifierGroupId));
    router.refresh();
  };

  return (
    <ModifierForm submitLabel="Create modifier group" disabled={disabled} onSubmit={handleSubmit} />
  );
}
