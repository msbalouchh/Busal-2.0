"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { MenuForm } from "@/modules/menu-management/components/menu-form";
import { updateMenuManagementAction } from "@/modules/menu-management/actions/menu-management-actions";
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";
import type { MenuManagementContext } from "@/modules/menu-management/lib/get-menu-management-context";
import type {
  MenuManagementInput,
  MenuManagementRecord,
} from "@/modules/menu-management/types/menu-management-types";

interface EditMenuFormProps {
  context: MenuManagementContext;
  menu: MenuManagementRecord;
}

export function EditMenuForm({ context, menu }: EditMenuFormProps) {
  const router = useRouter();

  const handleSubmit = async (input: MenuManagementInput) => {
    await updateMenuManagementAction(menu.id, input);
    toast.success("Menu updated");
    router.push(MENU_MANAGEMENT_ROUTES.details(menu.id));
    router.refresh();
  };

  return (
    <div className="rounded-xl border p-4 sm:p-6">
      <MenuForm
        initialMenu={menu}
        branches={context.branches}
        submitLabel="Save changes"
        disabled={!context.permissionsFlags.canUpdate}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
