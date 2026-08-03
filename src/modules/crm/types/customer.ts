import type {
  CommunicationChannel,
  CustomerStatus,
  MembershipTier,
  TimelineEventType,
} from "@/modules/crm/constants/customer-status";

/** Core customer entity — single source of truth identifier. */
export interface Customer {
  id: string;
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string | null;
  externalId: string | null;
  status: CustomerStatus;
  segmentIds: string[];
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfile {
  customerId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  avatarUrl: string | null;
  preferredLanguage: string;
  timezone: string;
}

export interface CustomerTimelineEvent {
  id: string;
  customerId: string;
  type: TimelineEventType;
  title: string;
  description: string;
  metadata: Record<string, string>;
  occurredAt: string;
  createdBy: string | null;
}

export interface CustomerNote {
  id: string;
  customerId: string;
  content: string;
  isPinned: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerTag {
  id: string;
  slug: string;
  name: string;
  color: string;
  tenantId: string;
}

export interface CustomerSegment {
  id: string;
  slug: string;
  name: string;
  description: string;
  tenantId: string;
  businessId: string;
  memberCount: number;
  criteria: string[];
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface CustomerCommunication {
  id: string;
  customerId: string;
  channel: CommunicationChannel;
  direction: "inbound" | "outbound";
  subject: string;
  body: string;
  status: "sent" | "delivered" | "read" | "failed";
  sentAt: string;
}

export interface CustomerPreferences {
  customerId: string;
  marketingOptIn: boolean;
  smsOptIn: boolean;
  emailOptIn: boolean;
  preferredContactChannel: CommunicationChannel;
  dietaryRestrictions: string[];
  seatingPreference: string | null;
}

export interface CustomerLoyaltyProfile {
  customerId: string;
  pointsBalance: number;
  lifetimePoints: number;
  tier: MembershipTier;
  rewardsRedeemed: number;
  lastEarnedAt: string | null;
}

export interface CustomerWallet {
  customerId: string;
  balancePence: number;
  currency: string;
  giftCardBalancePence: number;
  lastTransactionAt: string | null;
}

export interface CustomerMembership {
  customerId: string;
  tier: MembershipTier;
  memberSince: string;
  expiresAt: string | null;
  benefits: string[];
  isActive: boolean;
}

export interface CustomerAnalytics {
  customerId: string;
  totalOrders: number;
  totalSpentPence: number;
  averageOrderValuePence: number;
  lastOrderAt: string | null;
  visitCount: number;
  lifetimeValuePence: number;
  churnRiskScore: number;
}

export interface CustomerAiContext {
  customerId: string;
  summary: string;
  insights: string[];
  recommendedActions: string[];
  sentiment: "positive" | "neutral" | "negative";
  lastGeneratedAt: string;
}

/** Full customer record aggregating all CRM sub-entities. */
export interface CustomerRecord {
  customer: Customer;
  profile: CustomerProfile;
  timeline: CustomerTimelineEvent[];
  notes: CustomerNote[];
  tags: CustomerTag[];
  segments: CustomerSegment[];
  addresses: CustomerAddress[];
  communications: CustomerCommunication[];
  preferences: CustomerPreferences;
  loyalty: CustomerLoyaltyProfile;
  wallet: CustomerWallet;
  membership: CustomerMembership;
  analytics: CustomerAnalytics;
  aiContext: CustomerAiContext;
}

export interface CustomerSearchQuery {
  query?: string;
  tenantId?: string;
  businessId?: string;
  branchId?: string;
  status?: CustomerStatus;
  segmentId?: string;
  tagId?: string;
  limit?: number;
}

export interface CreateCustomerInput {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  status?: CustomerStatus;
  tagIds?: string[];
  segmentIds?: string[];
}

export interface UpdateCustomerInput {
  customerId: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  status?: CustomerStatus;
  tagIds?: string[];
  segmentIds?: string[];
}

export interface CrmPlatformContext {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string | null;
  userId: string;
}

export interface CrmContextValue {
  context: CrmPlatformContext;
  customers: CustomerRecord[];
  segments: CustomerSegment[];
  tags: CustomerTag[];
  selectedCustomer: CustomerRecord | null;
  selectCustomer: (customerId: string | null) => void;
  searchCustomers: (query: CustomerSearchQuery) => CustomerRecord[];
  refresh: () => void;
}
