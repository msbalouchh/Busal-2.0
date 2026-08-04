import { formatMoneyPence } from "@/modules/payments/utils/currency";
import { mapModuleStatusToPrisma } from "@/modules/crm/lib/crm-mappers";
import type { CustomerData } from "@/services/crm.service";
import type { getCrmDashboard } from "@/services/crm.service";
import type { CrmDashboardView, CustomerDetailView, CustomerView } from "@/modules/crm/types/crm";
import type { CustomerRecord } from "@/modules/crm/types/customer";

export function formatCrmMoney(pence: number): string {
  return formatMoneyPence(pence);
}

export function serializeCustomerRecord(record: CustomerRecord): CustomerView {
  return {
    id: record.customer.id,
    name: record.profile.displayName,
    phone: record.profile.phone,
    email: record.profile.email,
    groupName: record.segments[0]?.name ?? null,
    tags: record.tags.map((tag) => tag.name),
    status: mapModuleStatusToPrisma(record.customer.status),
    loyaltyPoints: record.loyalty.pointsBalance,
  };
}

export function serializeCustomerRecordDetail(record: CustomerRecord): CustomerDetailView {
  return {
    ...serializeCustomerRecord(record),
    dateOfBirth: record.profile.dateOfBirth,
    address: record.addresses[0]?.line1 ?? null,
    notes: record.notes[0]?.content ?? null,
  };
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
