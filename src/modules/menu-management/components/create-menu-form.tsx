"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { MenuForm } from "@/modules/menu-management/components/menu-form";
import { createMenuManagementAction } from "@/modules/menu-management/actions/menu-management-actions";
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";
import type { MenuManagementContext } from "@/modules/menu-management/lib/get-menu-management-context";
import type { MenuManagementInput } from "@/modules/menu-management/types/menu-management-types";

interface CreateMenuFormProps {
  context: MenuManagementContext;
}

export function CreateMenuForm({ context }: CreateMenuFormProps) {
  const router = useRouter();

  const handleSubmit = async (input: MenuManagementInput) => {
    const result = await createMenuManagementAction(input);
    toast.success("Menu created");
    router.push(MENU_MANAGEMENT_ROUTES.details(result.menuId));
    router.refresh();
  };

  return (
    <div className="rounded-xl border p-4 sm:p-6">
      <MenuForm
        branches={context.branches}
        submitLabel="Create menu"
        disabled={!context.permissionsFlags.canCreate}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
