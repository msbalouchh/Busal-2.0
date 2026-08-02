"use client";

import { useRouter } from "next/navigation";

import { createOrderManagementAction } from "@/modules/order-management/actions/order-management-actions";
import { OrderForm } from "@/modules/order-management/components/order-form";
import { ORDER_MANAGEMENT_ROUTES } from "@/modules/order-management/constants/routes";
import type {
  OrderManagementInput,
  ProductSelectOption,
} from "@/modules/order-management/types/order-management-types";

interface CreateOrderFormProps {
  branchId: string;
  products: ProductSelectOption[];
  tables: { id: string; label: string }[];
  staff: { id: string; label: string }[];
  customers: { id: string; label: string }[];
  disabled?: boolean;
}

export function CreateOrderForm({
  branchId,
  products,
  tables,
  staff,
  customers,
  disabled = false,
}: CreateOrderFormProps) {
  const router = useRouter();

  const handleSubmit = async (input: OrderManagementInput) => {
    const result = await createOrderManagementAction(branchId, input);

    if (result.success) {
      router.push(ORDER_MANAGEMENT_ROUTES.details(result.orderId, branchId));
      router.refresh();
    }
  };

  return (
    <OrderForm
      branchId={branchId}
      products={products}
      tables={tables}
      staff={staff}
      customers={customers}
      submitLabel="Create order"
      disabled={disabled}
      onSubmit={handleSubmit}
    />
  );
}
