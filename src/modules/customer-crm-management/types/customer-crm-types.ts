import type { CustomerStatus, LoyaltyTier, LoyaltyTransactionType } from "@prisma/client";

export interface CustomerAddressRecord {
  id: string;
  label: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyAccountRecord {
  id: string;
  membershipNumber: string;
  tier: LoyaltyTier;
  pointsBalance: number;
  lifetimePoints: number;
  totalRedeemedPoints: number;
  joinedAt: string;
}

export interface LoyaltyTransactionRecord {
  id: string;
  type: LoyaltyTransactionType;
  points: number;
  reference: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CustomerCrmRecord {
  id: string;
  businessId: string;
  customerCode: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  profileImage: string | null;
  preferredLanguage: string | null;
  marketingConsent: boolean;
  status: CustomerStatus;
  notes: string | null;
  tags: string[];
  totalOrders: number;
  totalSpend: number;
  averageOrderValue: number;
  lastOrderAt: string | null;
  lastVisitAt: string | null;
  loyaltyPoints: number;
  loyaltyAccount: LoyaltyAccountRecord | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListQuery {
  search?: string;
  status?: CustomerStatus | "ALL";
  tag?: string;
  page?: number;
  pageSize?: number;
}

export interface CustomerListResult {
  items: CustomerCrmRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CustomerDashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  totalLifetimeSpend: number;
  averageOrderValue: number;
  loyaltyMembers: number;
}

export interface CustomerRegistrationInput {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  name?: string;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  profileImage?: string | null;
  preferredLanguage?: string | null;
  marketingConsent?: boolean;
  notes?: string | null;
  tags?: string[];
  status?: CustomerStatus;
}

export interface CustomerAddressInput {
  label?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city?: string | null;
  postcode?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean;
}

export interface CustomerTimelineItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
}

export interface CustomerOrderHistoryItem {
  id: string;
  orderNumber: string;
  orderType: string;
  totalAmount: number;
  status: string;
  placedAt: string;
}

export interface CustomerReservationHistoryItem {
  id: string;
  reservationNumber: string;
  status: string;
  scheduledAt: string;
  partySize: number;
}

export interface CustomerPaymentHistoryItem {
  id: string;
  paymentNumber: string;
  amountPaid: number;
  paymentMethod: string;
  paidAt: string | null;
}

export interface CustomerProfileBundle {
  customer: CustomerCrmRecord;
  addresses: CustomerAddressRecord[];
  timeline: CustomerTimelineItem[];
  orders: CustomerOrderHistoryItem[];
  reservations: CustomerReservationHistoryItem[];
  payments: CustomerPaymentHistoryItem[];
  loyaltyTransactions: LoyaltyTransactionRecord[];
}

export interface DuplicateCustomerMatch {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  matchReason: "email" | "phone" | "name";
}

export interface CustomerMergeInput {
  targetCustomerId: string;
  sourceCustomerId: string;
}

export interface CustomerImportRow {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  tags?: string;
  notes?: string;
  marketingConsent?: string;
}

export interface LoyaltyPointsInput {
  customerId: string;
  points: number;
  reference?: string | null;
  notes?: string | null;
}
