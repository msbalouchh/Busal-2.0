"use client";

import { useCrm } from "@/modules/crm/hooks/use-crm";

export function useCustomer(customerId?: string | null) {
  const { selectedCustomer, selectCustomer, customers } = useCrm();
  const resolvedId = customerId ?? selectedCustomer?.customer.id ?? null;
  const customer =
    customers.find((record) => record.customer.id === resolvedId) ?? selectedCustomer;

  return {
    customer,
    customerId: resolvedId,
    selectCustomer,
  };
}
