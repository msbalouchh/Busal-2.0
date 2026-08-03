import {
  COMMUNICATION_CHANNELS,
  CUSTOMER_STATUSES,
  MEMBERSHIP_TIERS,
  TIMELINE_EVENT_TYPES,
} from "@/modules/crm/constants/customer-status";
import type { CustomerRecord, CustomerSegment, CustomerTag } from "@/modules/crm/types/customer";

export const DEFAULT_CRM_SCOPE = {
  tenantId: "tenant-harbour",
  workspaceId: "ws-harbour-kitchen",
  businessId: "biz-harbour-kitchen",
  branchId: "branch-harbour-main",
  userId: "user-harbour-owner",
} as const;

export const MOCK_CRM_TAGS: CustomerTag[] = [
  { id: "tag-vip", slug: "vip", name: "VIP", color: "#D4AF37", tenantId: "tenant-harbour" },
  {
    id: "tag-regular",
    slug: "regular",
    name: "Regular",
    color: "#64748B",
    tenantId: "tenant-harbour",
  },
  {
    id: "tag-corporate",
    slug: "corporate",
    name: "Corporate",
    color: "#2563EB",
    tenantId: "tenant-harbour",
  },
  {
    id: "tag-high-value",
    slug: "high-value",
    name: "High Value",
    color: "#059669",
    tenantId: "tenant-harbour",
  },
];

export const MOCK_CRM_SEGMENTS: CustomerSegment[] = [
  {
    id: "seg-vip-diners",
    slug: "vip-diners",
    name: "VIP Diners",
    description: "High-spend repeat guests",
    tenantId: "tenant-harbour",
    businessId: "biz-harbour-kitchen",
    memberCount: 42,
    criteria: ["lifetime_value > 5000", "visit_count >= 10"],
  },
  {
    id: "seg-weekend-regulars",
    slug: "weekend-regulars",
    name: "Weekend Regulars",
    description: "Guests who visit Fri–Sun",
    tenantId: "tenant-harbour",
    businessId: "biz-harbour-kitchen",
    memberCount: 128,
    criteria: ["preferred_day in (fri,sat,sun)"],
  },
  {
    id: "seg-at-risk",
    slug: "at-risk",
    name: "At Risk",
    description: "No visit in 60+ days",
    tenantId: "tenant-harbour",
    businessId: "biz-harbour-kitchen",
    memberCount: 23,
    criteria: ["days_since_last_visit > 60"],
  },
];

function buildCustomerRecord(partial: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: (typeof CUSTOMER_STATUSES)[keyof typeof CUSTOMER_STATUSES];
  tagIds: string[];
  segmentIds: string[];
  totalSpentPence: number;
  visitCount: number;
  points: number;
  tier: (typeof MEMBERSHIP_TIERS)[keyof typeof MEMBERSHIP_TIERS];
  branchId?: string;
}): CustomerRecord {
  const now = "2026-02-15T10:00:00.000Z";
  const displayName = `${partial.firstName} ${partial.lastName}`;

  return {
    customer: {
      id: partial.id,
      tenantId: "tenant-harbour",
      workspaceId: "ws-harbour-kitchen",
      businessId: "biz-harbour-kitchen",
      branchId: partial.branchId ?? "branch-harbour-main",
      externalId: null,
      status: partial.status,
      segmentIds: partial.segmentIds,
      tagIds: partial.tagIds,
      createdAt: "2025-06-01T10:00:00.000Z",
      updatedAt: now,
    },
    profile: {
      customerId: partial.id,
      firstName: partial.firstName,
      lastName: partial.lastName,
      displayName,
      email: partial.email,
      phone: partial.phone,
      dateOfBirth: "1985-03-12",
      avatarUrl: null,
      preferredLanguage: "en-GB",
      timezone: "Europe/London",
    },
    timeline: [
      {
        id: `tl-${partial.id}-1`,
        customerId: partial.id,
        type: TIMELINE_EVENT_TYPES.ORDER,
        title: "Dinner order",
        description: "Table 12 — £86.50",
        metadata: { orderId: "ord-1042" },
        occurredAt: "2026-02-10T19:30:00.000Z",
        createdBy: null,
      },
      {
        id: `tl-${partial.id}-2`,
        customerId: partial.id,
        type: TIMELINE_EVENT_TYPES.LOYALTY,
        title: "Points earned",
        description: "+120 loyalty points",
        metadata: { points: "120" },
        occurredAt: "2026-02-10T19:45:00.000Z",
        createdBy: null,
      },
    ],
    notes: [
      {
        id: `note-${partial.id}-1`,
        customerId: partial.id,
        content: "Prefers window seating. Allergic to shellfish.",
        isPinned: true,
        createdBy: "user-harbour-manager",
        createdAt: "2025-11-01T10:00:00.000Z",
        updatedAt: "2025-11-01T10:00:00.000Z",
      },
    ],
    tags: MOCK_CRM_TAGS.filter((tag) => partial.tagIds.includes(tag.id)),
    segments: MOCK_CRM_SEGMENTS.filter((segment) => partial.segmentIds.includes(segment.id)),
    addresses: [
      {
        id: `addr-${partial.id}-1`,
        customerId: partial.id,
        label: "Home",
        line1: "14 Harbour View",
        line2: null,
        city: "London",
        region: "Greater London",
        postalCode: "E1W 2BB",
        country: "GB",
        isDefault: true,
      },
    ],
    communications: [
      {
        id: `comm-${partial.id}-1`,
        customerId: partial.id,
        channel: COMMUNICATION_CHANNELS.EMAIL,
        direction: "outbound",
        subject: "Thank you for dining with us",
        body: "We hope you enjoyed your visit.",
        status: "delivered",
        sentAt: "2026-02-11T09:00:00.000Z",
      },
    ],
    preferences: {
      customerId: partial.id,
      marketingOptIn: true,
      smsOptIn: true,
      emailOptIn: true,
      preferredContactChannel: COMMUNICATION_CHANNELS.EMAIL,
      dietaryRestrictions: ["shellfish"],
      seatingPreference: "window",
    },
    loyalty: {
      customerId: partial.id,
      pointsBalance: partial.points,
      lifetimePoints: partial.points * 3,
      tier: partial.tier,
      rewardsRedeemed: 2,
      lastEarnedAt: "2026-02-10T19:45:00.000Z",
    },
    wallet: {
      customerId: partial.id,
      balancePence: 2500,
      currency: "GBP",
      giftCardBalancePence: 5000,
      lastTransactionAt: "2026-02-10T19:30:00.000Z",
    },
    membership: {
      customerId: partial.id,
      tier: partial.tier,
      memberSince: "2025-06-01T10:00:00.000Z",
      expiresAt: null,
      benefits: ["Priority reservations", "Birthday reward"],
      isActive: true,
    },
    analytics: {
      customerId: partial.id,
      totalOrders: partial.visitCount,
      totalSpentPence: partial.totalSpentPence,
      averageOrderValuePence: Math.round(partial.totalSpentPence / partial.visitCount),
      lastOrderAt: "2026-02-10T19:30:00.000Z",
      visitCount: partial.visitCount,
      lifetimeValuePence: partial.totalSpentPence,
      churnRiskScore: partial.visitCount > 10 ? 0.12 : 0.45,
    },
    aiContext: {
      customerId: partial.id,
      summary: `${displayName} is a ${partial.tier} member with ${partial.visitCount} visits.`,
      insights: [
        "Visits increased 20% over the last quarter.",
        "Responds well to email promotions.",
      ],
      recommendedActions: [
        "Invite to spring tasting menu event.",
        "Offer loyalty bonus for weekday visit.",
      ],
      sentiment: "positive",
      lastGeneratedAt: now,
    },
  };
}

export const MOCK_CUSTOMER_RECORDS: CustomerRecord[] = [
  buildCustomerRecord({
    id: "cust-harbour-001",
    firstName: "Emma",
    lastName: "Thompson",
    email: "emma.thompson@example.com",
    phone: "+44 7700 900001",
    status: CUSTOMER_STATUSES.VIP,
    tagIds: ["tag-vip", "tag-high-value"],
    segmentIds: ["seg-vip-diners"],
    totalSpentPence: 845000,
    visitCount: 34,
    points: 4200,
    tier: MEMBERSHIP_TIERS.PLATINUM,
  }),
  buildCustomerRecord({
    id: "cust-harbour-002",
    firstName: "James",
    lastName: "Okonkwo",
    email: "james.okonkwo@example.com",
    phone: "+44 7700 900002",
    status: CUSTOMER_STATUSES.ACTIVE,
    tagIds: ["tag-regular"],
    segmentIds: ["seg-weekend-regulars"],
    totalSpentPence: 128000,
    visitCount: 12,
    points: 960,
    tier: MEMBERSHIP_TIERS.SILVER,
  }),
  buildCustomerRecord({
    id: "cust-harbour-003",
    firstName: "Sophie",
    lastName: "Laurent",
    email: "sophie.laurent@example.com",
    phone: "+44 7700 900003",
    status: CUSTOMER_STATUSES.PROSPECT,
    tagIds: ["tag-corporate"],
    segmentIds: ["seg-at-risk"],
    totalSpentPence: 45000,
    visitCount: 3,
    points: 180,
    tier: MEMBERSHIP_TIERS.BRONZE,
    branchId: "branch-harbour-harbourfront",
  }),
  buildCustomerRecord({
    id: "cust-northside-001",
    firstName: "Jordan",
    lastName: "Lee",
    email: "jordan.lee@example.com",
    phone: "+44 7700 900004",
    status: CUSTOMER_STATUSES.ACTIVE,
    tagIds: ["tag-regular"],
    segmentIds: [],
    totalSpentPence: 320000,
    visitCount: 18,
    points: 1500,
    tier: MEMBERSHIP_TIERS.GOLD,
  }),
];

// Northside customer uses different tenant scope
MOCK_CUSTOMER_RECORDS[3]!.customer.tenantId = "tenant-northside";
MOCK_CUSTOMER_RECORDS[3]!.customer.workspaceId = "ws-northside-retail";
MOCK_CUSTOMER_RECORDS[3]!.customer.businessId = "biz-northside-retail";
MOCK_CUSTOMER_RECORDS[3]!.customer.branchId = "branch-northside-flagship";
