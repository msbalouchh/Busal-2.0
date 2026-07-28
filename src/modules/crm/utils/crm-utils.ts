import { formatMoneyPence } from "@/modules/payments/utils/currency";
import type { CustomerData } from "@/services/crm.service";
import type { getCrmDashboard } from "@/services/crm.service";
import type { CrmDashboardView, CustomerDetailView, CustomerView } from "@/modules/crm/types/crm";

export function formatCrmMoney(pence: number): string {
  return formatMoneyPence(pence);
}

export function serializeCustomer(customer: CustomerData): CustomerView {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    groupName: customer.groupName,
    tags: customer.tags,
    status: customer.status,
    loyaltyPoints: customer.loyaltyPoints,
  };
}

export function serializeCustomerDetail(customer: CustomerData): CustomerDetailView {
  return {
    ...serializeCustomer(customer),
    dateOfBirth: customer.dateOfBirth?.toISOString() ?? null,
    address: customer.address,
    notes: customer.notes,
  };
}

export function serializeCrmDashboard(
  dashboard: Awaited<ReturnType<typeof getCrmDashboard>>,
): CrmDashboardView {
  return dashboard;
}
