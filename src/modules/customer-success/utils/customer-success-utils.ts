import type {
  Customer360ProfileData,
  CustomerSuccessDashboardData,
  SuccessPlaybookData,
} from "@/services/customer-success.service";

export type Customer360ProfileView = Customer360ProfileData;
export type CustomerSuccessDashboardView = CustomerSuccessDashboardData;
export type SuccessPlaybookView = SuccessPlaybookData;

export function serializeCustomer360Profile(
  profile: Customer360ProfileData,
): Customer360ProfileView {
  return profile;
}

export function serializeCustomerSuccessDashboard(
  dashboard: CustomerSuccessDashboardData,
): CustomerSuccessDashboardView {
  return dashboard;
}

export function serializeSuccessPlaybook(playbook: SuccessPlaybookData): SuccessPlaybookView {
  return playbook;
}
