"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { SupplierForm } from "@/modules/inventory-supplier-management/components/supplier-form";
import { createSupplierAction } from "@/modules/inventory-supplier-management/actions/inventory-supplier-actions";
import { INVENTORY_SUPPLIER_ROUTES } from "@/modules/inventory-supplier-management/constants/routes";
import type { SupplierInput } from "@/modules/inventory-supplier-management/types/inventory-supplier-types";

interface CreateSupplierFormProps {
  disabled?: boolean;
}

export function CreateSupplierForm({ disabled = false }: CreateSupplierFormProps) {
  const router = useRouter();

  const handleSubmit = async (input: SupplierInput) => {
    const supplier = await createSupplierAction(input);
    toast.success("Supplier created");
    router.push(INVENTORY_SUPPLIER_ROUTES.supplier(supplier.id));
    router.refresh();
  };

  return <SupplierForm submitLabel="Create supplier" disabled={disabled} onSubmit={handleSubmit} />;
}
