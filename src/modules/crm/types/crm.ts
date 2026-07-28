import type { CustomerStatus } from "@prisma/client";

export interface CustomerView {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  groupName: string | null;
  tags: string[];
  status: CustomerStatus;
  loyaltyPoints: number;
}

export interface CustomerDetailView extends CustomerView {
  dateOfBirth: string | null;
  address: string | null;
  notes: string | null;
}

export interface CrmDashboardView {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  vipCustomers: number;
  topSpenders: Array<{
    id: string;
    name: string;
    totalSpentPence: number;
    loyaltyPoints: number;
  }>;
  loyaltyStatistics: {
    totalPointsOutstanding: number;
    totalPointTransactions: number;
  };
}
