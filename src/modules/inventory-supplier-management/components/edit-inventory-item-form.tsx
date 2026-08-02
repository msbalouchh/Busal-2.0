"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { InventoryItemForm } from "@/modules/inventory-supplier-management/components/inventory-item-form";
import { updateInventoryItemAction } from "@/modules/inventory-supplier-management/actions/inventory-supplier-actions";
import { INVENTORY_SUPPLIER_ROUTES } from "@/modules/inventory-supplier-management/constants/routes";
import type {
  InventoryItemInput,
  InventoryItemRecord,
} from "@/modules/inventory-supplier-management/types/inventory-supplier-types";

interface EditInventoryItemFormProps {
  branchId: string;
  item: InventoryItemRecord;
  disabled?: boolean;
}

export function EditInventoryItemForm({
  branchId,
  item,
  disabled = false,
}: EditInventoryItemFormProps) {
  const router = useRouter();

  const handleSubmit = async (input: InventoryItemInput) => {
    await updateInventoryItemAction(branchId, item.id, input);
    toast.success("Inventory item updated");
    router.push(INVENTORY_SUPPLIER_ROUTES.item(item.id, branchId));
    router.refresh();
  };

  return (
    <InventoryItemForm
      initial={{
        sku: item.sku,
        barcode: item.barcode,
        name: item.name,
        description: item.description,
        category: item.category,
        unit: item.unit,
        minimumStock: item.minimumStock,
        maximumStock: item.maximumStock,
        reorderLevel: item.reorderLevel,
        averageCost: item.averageCost,
        trackStock: item.trackStock,
        status: item.status,
      }}
      submitLabel="Save changes"
      disabled={disabled}
      onSubmit={handleSubmit}
    />
  );
}
