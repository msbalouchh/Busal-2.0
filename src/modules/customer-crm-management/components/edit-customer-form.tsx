"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { CustomerForm } from "@/modules/customer-crm-management/components/customer-form";
import { updateCustomerAction } from "@/modules/customer-crm-management/actions/customer-crm-actions";
import { CUSTOMER_CRM_ROUTES } from "@/modules/customer-crm-management/constants/routes";
import type {
  CustomerCrmRecord,
  CustomerRegistrationInput,
} from "@/modules/customer-crm-management/types/customer-crm-types";

interface EditCustomerFormProps {
  customer: CustomerCrmRecord;
  disabled?: boolean;
}

export function EditCustomerForm({ customer, disabled = false }: EditCustomerFormProps) {
  const router = useRouter();

  const handleSubmit = async (input: CustomerRegistrationInput) => {
    await updateCustomerAction(customer.id, input);
    toast.success("Customer updated");
    router.push(CUSTOMER_CRM_ROUTES.profile(customer.id));
    router.refresh();
  };

  return (
    <CustomerForm
      initial={{
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        dateOfBirth: customer.dateOfBirth,
        gender: customer.gender,
        preferredLanguage: customer.preferredLanguage,
        notes: customer.notes,
        tags: customer.tags,
        marketingConsent: customer.marketingConsent,
        status: customer.status,
      }}
      submitLabel="Save changes"
      disabled={disabled}
      onSubmit={handleSubmit}
    />
  );
}
