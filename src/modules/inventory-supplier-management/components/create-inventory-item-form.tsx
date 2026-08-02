"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { InventoryItemForm } from "@/modules/inventory-supplier-management/components/inventory-item-form";
import { createInventoryItemAction } from "@/modules/inventory-supplier-management/actions/inventory-supplier-actions";
import { INVENTORY_SUPPLIER_ROUTES } from "@/modules/inventory-supplier-management/constants/routes";
import type { InventoryItemInput } from "@/modules/inventory-supplier-management/types/inventory-supplier-types";

interface CreateInventoryItemFormProps {
  branchId: string;
  disabled?: boolean;
}

export function CreateInventoryItemForm({
  branchId,
  disabled = false,
}: CreateInventoryItemFormProps) {
  const router = useRouter();

  const handleSubmit = async (input: InventoryItemInput) => {
    const item = await createInventoryItemAction(branchId, input);
    toast.success("Inventory item created");
    router.push(INVENTORY_SUPPLIER_ROUTES.item(item.id, branchId));
    router.refresh();
  };

  return (
    <InventoryItemForm
      submitLabel="Create item"
      allowInitialStock
      disabled={disabled}
      onSubmit={handleSubmit}
    />
  );
}
