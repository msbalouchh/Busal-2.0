"use client";

import { useRouter } from "next/navigation";

import { updateOrderManagementAction } from "@/modules/order-management/actions/order-management-actions";
import { OrderForm } from "@/modules/order-management/components/order-form";
import { ORDER_MANAGEMENT_ROUTES } from "@/modules/order-management/constants/routes";
import type {
  OrderManagementInput,
  OrderManagementRecord,
  ProductSelectOption,
} from "@/modules/order-management/types/order-management-types";

interface EditOrderFormProps {
  branchId: string;
  order: OrderManagementRecord;
  products: ProductSelectOption[];
  tables: { id: string; label: string }[];
  staff: { id: string; label: string }[];
  customers: { id: string; label: string }[];
  disabled?: boolean;
}

export function EditOrderForm({
  branchId,
  order,
  products,
  tables,
  staff,
  customers,
  disabled = false,
}: EditOrderFormProps) {
  const router = useRouter();

  const handleSubmit = async (input: OrderManagementInput) => {
    await updateOrderManagementAction(branchId, order.id, input);
    router.push(ORDER_MANAGEMENT_ROUTES.details(order.id, branchId));
    router.refresh();
  };

  return (
    <OrderForm
      branchId={branchId}
      products={products}
      tables={tables}
      staff={staff}
      customers={customers}
      initialOrder={order}
      submitLabel="Save changes"
      disabled={disabled}
      onSubmit={handleSubmit}
    />
  );
}
