"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { CustomerForm } from "@/modules/customer-crm-management/components/customer-form";
import {
  findDuplicateCustomersAction,
  registerCustomerAction,
} from "@/modules/customer-crm-management/actions/customer-crm-actions";
import { CUSTOMER_CRM_ROUTES } from "@/modules/customer-crm-management/constants/routes";
import type { CustomerRegistrationInput } from "@/modules/customer-crm-management/types/customer-crm-types";

interface CreateCustomerFormProps {
  disabled?: boolean;
}

export function CreateCustomerForm({ disabled = false }: CreateCustomerFormProps) {
  const router = useRouter();

  const handleSubmit = async (input: CustomerRegistrationInput) => {
    const duplicates = await findDuplicateCustomersAction(input);
    if (duplicates.length > 0) {
      const match = duplicates[0];
      toast.error(
        `Possible duplicate: ${match?.name ?? "Customer"} (${match?.matchReason ?? "match"})`,
      );
      return;
    }

    const customer = await registerCustomerAction(input);
    toast.success("Customer registered");
    router.push(CUSTOMER_CRM_ROUTES.profile(customer.id));
    router.refresh();
  };

  return (
    <CustomerForm submitLabel="Register customer" disabled={disabled} onSubmit={handleSubmit} />
  );
}
