import type {
  CommunicationChannel as PrismaCommunicationChannel,
  CustomerStatus as PrismaCustomerStatus,
  LoyaltyTier,
  Prisma,
} from "@prisma/client";

import {
  COMMUNICATION_CHANNELS,
  CUSTOMER_STATUSES,
  MEMBERSHIP_TIERS,
  TIMELINE_EVENT_TYPES,
  type CommunicationChannel,
  type CustomerStatus,
  type MembershipTier,
  type TimelineEventType,
} from "@/modules/crm/constants/customer-status";
import { moneyDecimalToPence } from "@/modules/payments/utils/currency";
import type {
  CustomerAddress,
  CustomerAiContext,
  CustomerAnalytics,
  CustomerCommunication,
  CustomerLoyaltyProfile,
  CustomerMembership,
  CustomerNote,
  CustomerPreferences,
  CustomerProfile,
  CustomerRecord,
  CustomerSegment,
  CustomerTag,
  CustomerTimelineEvent,
  CustomerWallet,
} from "@/modules/crm/types/customer";
import type { CrmTenantScope } from "@/modules/crm/lib/crm-scope";

export const customerRecordInclude = {
  group: true,
  addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
  internalNotes: {
    orderBy: [{ createdAt: "desc" }],
    include: { staff: { select: { firstName: true, lastName: true } } },
  },
  timelineEvents: { orderBy: [{ createdAt: "desc" }], take: 50 },
  loyaltyAccount: true,
  communicationConversations: {
    orderBy: [{ lastMessageAt: "desc" }],
    take: 10,
    include: {
      messages: { orderBy: [{ createdAt: "desc" }], take: 5 },
    },
  },
  rewardRedemptions: {
    orderBy: [{ createdAt: "desc" }],
    take: 10,
    include: { reward: true },
  },
} satisfies Prisma.CustomerInclude;

export type PrismaCustomerWithRelations = Prisma.CustomerGetPayload<{
  include: typeof customerRecordInclude;
}>;

function slugifyTag(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function mapPrismaStatusToModule(
  status: PrismaCustomerStatus,
  groupSlug?: string | null,
): CustomerStatus {
  if (groupSlug === "vip") {
    return CUSTOMER_STATUSES.VIP;
  }

  switch (status) {
    case "ACTIVE":
      return CUSTOMER_STATUSES.ACTIVE;
    case "INACTIVE":
    case "ARCHIVED":
      return CUSTOMER_STATUSES.INACTIVE;
    case "BLOCKED":
      return CUSTOMER_STATUSES.BLOCKED;
    default:
      return CUSTOMER_STATUSES.ACTIVE;
  }
}

export function mapModuleStatusToPrisma(status: CustomerStatus): PrismaCustomerStatus {
  switch (status) {
    case CUSTOMER_STATUSES.ACTIVE:
    case CUSTOMER_STATUSES.VIP:
    case CUSTOMER_STATUSES.PROSPECT:
      return "ACTIVE";
    case CUSTOMER_STATUSES.INACTIVE:
      return "INACTIVE";
    case CUSTOMER_STATUSES.BLOCKED:
      return "BLOCKED";
    default:
      return "ACTIVE";
  }
}

function mapLoyaltyTier(tier: LoyaltyTier | null | undefined): MembershipTier {
  switch (tier) {
    case "SILVER":
      return MEMBERSHIP_TIERS.SILVER;
    case "GOLD":
      return MEMBERSHIP_TIERS.GOLD;
    case "PLATINUM":
    case "VIP":
      return MEMBERSHIP_TIERS.PLATINUM;
    default:
      return MEMBERSHIP_TIERS.BRONZE;
  }
}

function mapTimelineEventType(eventType: string): TimelineEventType {
  switch (eventType) {
    case "ORDER":
      return TIMELINE_EVENT_TYPES.ORDER;
    case "PAYMENT":
      return TIMELINE_EVENT_TYPES.PAYMENT;
    case "LOYALTY":
    case "REWARD":
      return TIMELINE_EVENT_TYPES.LOYALTY;
    case "NOTE":
      return TIMELINE_EVENT_TYPES.NOTE;
    case "PROFILE":
      return TIMELINE_EVENT_TYPES.CREATED;
    default:
      return TIMELINE_EVENT_TYPES.NOTE;
  }
}

function mapCommunicationChannel(channel: PrismaCommunicationChannel): CommunicationChannel {
  switch (channel) {
    case "SMS":
      return COMMUNICATION_CHANNELS.SMS;
    case "WHATSAPP":
      return COMMUNICATION_CHANNELS.WHATSAPP;
    case "LIVE_CHAT":
      return COMMUNICATION_CHANNELS.IN_APP;
    default:
      return COMMUNICATION_CHANNELS.EMAIL;
  }
}

function mapDeliveryStatus(status: string): CustomerCommunication["status"] {
  switch (status) {
    case "DELIVERED":
      return "delivered";
    case "READ":
      return "read";
    case "FAILED":
    case "BOUNCED":
      return "failed";
    default:
      return "sent";
  }
}

function buildTags(scope: CrmTenantScope, tagSlugs: string[]): CustomerTag[] {
  return tagSlugs.map((tag) => ({
    id: `${scope.businessId}:${slugifyTag(tag)}`,
    slug: slugifyTag(tag),
    name: tag,
    color: "#64748B",
    tenantId: scope.tenantId,
  }));
}

function computeChurnRisk(lastOrderAt: Date | null, totalOrders: number): number {
  if (!lastOrderAt) {
    return totalOrders > 0 ? 0.55 : 0.35;
  }

  const daysSince = Math.floor((Date.now() - lastOrderAt.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSince <= 14) return 0.1;
  if (daysSince <= 30) return 0.25;
  if (daysSince <= 60) return 0.45;
  if (daysSince <= 90) return 0.65;
  return 0.85;
}

export function mapCustomerToRecord(
  customer: PrismaCustomerWithRelations,
  scope: CrmTenantScope,
  segments: CustomerSegment[] = [],
): CustomerRecord {
  const firstName = customer.firstName ?? customer.name.split(" ")[0] ?? customer.name;
  const lastName = (customer.lastName ?? customer.name.split(" ").slice(1).join(" ")) || "";
  const displayName = customer.fullName ?? customer.name;
  const groupSlug = customer.group?.slug ?? null;
  const status = mapPrismaStatusToModule(customer.status, groupSlug);
  const totalSpentPence = moneyDecimalToPence(customer.totalSpend);
  const averageOrderValuePence = moneyDecimalToPence(customer.averageOrderValue);
  const tier = mapLoyaltyTier(customer.loyaltyAccount?.tier);
  const segmentIds = customer.groupId ? [customer.groupId] : [];
  const tagIds = buildTags(scope, customer.tags).map((tag) => tag.id);
  const churnRiskScore = computeChurnRisk(customer.lastOrderAt, customer.totalOrders);

  const profile: CustomerProfile = {
    customerId: customer.id,
    firstName,
    lastName,
    displayName,
    email: customer.email,
    phone: customer.phone,
    dateOfBirth: customer.dateOfBirth?.toISOString() ?? null,
    avatarUrl: customer.profileImage,
    preferredLanguage: customer.preferredLanguage ?? "en-GB",
    timezone: "Europe/London",
  };

  const timeline: CustomerTimelineEvent[] = customer.timelineEvents.map((event) => ({
    id: event.id,
    customerId: customer.id,
    type: mapTimelineEventType(event.eventType),
    title: event.title,
    description: event.description ?? "",
    metadata: {},
    occurredAt: event.createdAt.toISOString(),
    createdBy: event.staffId,
  }));

  const notes: CustomerNote[] = customer.internalNotes.map((note) => ({
    id: note.id,
    customerId: customer.id,
    content: note.content,
    isPinned: false,
    createdBy: note.staffId ?? scope.userId,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.createdAt.toISOString(),
  }));

  const addresses: CustomerAddress[] = customer.addresses.map((address) => ({
    id: address.id,
    customerId: customer.id,
    label: address.label ?? "Address",
    line1: address.addressLine1,
    line2: address.addressLine2,
    city: address.city ?? "",
    region: null,
    postalCode: address.postcode ?? "",
    country: address.country ?? "GB",
    isDefault: address.isDefault,
  }));

  const communications: CustomerCommunication[] = customer.communicationConversations.flatMap(
    (conversation) =>
      conversation.messages.map((message) => ({
        id: message.id,
        customerId: customer.id,
        channel: mapCommunicationChannel(message.channel),
        direction: message.senderCustomerId === customer.id ? "inbound" : "outbound",
        subject: message.subject ?? conversation.subject ?? "Message",
        body: message.body,
        status: mapDeliveryStatus(message.deliveryStatus),
        sentAt: (message.sentAt ?? message.createdAt).toISOString(),
      })),
  );

  const preferences: CustomerPreferences = {
    customerId: customer.id,
    marketingOptIn: customer.marketingConsent,
    smsOptIn: customer.marketingConsent,
    emailOptIn: customer.marketingConsent,
    preferredContactChannel: customer.email
      ? COMMUNICATION_CHANNELS.EMAIL
      : COMMUNICATION_CHANNELS.SMS,
    dietaryRestrictions: [],
    seatingPreference: null,
  };

  const loyalty: CustomerLoyaltyProfile = {
    customerId: customer.id,
    pointsBalance: customer.loyaltyAccount?.pointsBalance ?? customer.loyaltyPoints,
    lifetimePoints: customer.loyaltyAccount?.lifetimePoints ?? customer.loyaltyPoints,
    tier,
    rewardsRedeemed: customer.rewardRedemptions.length,
    lastEarnedAt: customer.loyaltyAccount?.updatedAt.toISOString() ?? null,
  };

  const wallet: CustomerWallet = {
    customerId: customer.id,
    balancePence: 0,
    currency: "GBP",
    giftCardBalancePence: 0,
    lastTransactionAt: customer.lastOrderAt?.toISOString() ?? null,
  };

  const membership: CustomerMembership = {
    customerId: customer.id,
    tier,
    memberSince: (customer.loyaltyAccount?.joinedAt ?? customer.createdAt).toISOString(),
    expiresAt: null,
    benefits: customer.group?.name ? [`${customer.group.name} member`] : [],
    isActive: customer.deletedAt === null && customer.status === "ACTIVE",
  };

  const analytics: CustomerAnalytics = {
    customerId: customer.id,
    totalOrders: customer.totalOrders,
    totalSpentPence,
    averageOrderValuePence,
    lastOrderAt: customer.lastOrderAt?.toISOString() ?? null,
    visitCount: customer.totalOrders,
    lifetimeValuePence: totalSpentPence,
    churnRiskScore,
  };

  const aiContext: CustomerAiContext = {
    customerId: customer.id,
    summary: `${displayName} · ${customer.totalOrders} orders · ${tier} tier`,
    insights: [],
    recommendedActions: [],
    sentiment:
      churnRiskScore > 0.5 ? "negative" : totalSpentPence > 100000 ? "positive" : "neutral",
    lastGeneratedAt: new Date().toISOString(),
  };

  return {
    customer: {
      id: customer.id,
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      externalId: customer.customerCode,
      status,
      segmentIds,
      tagIds,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    },
    profile,
    timeline,
    notes,
    tags: buildTags(scope, customer.tags),
    segments: segments.filter((segment) => segmentIds.includes(segment.id)),
    addresses,
    communications,
    preferences,
    loyalty,
    wallet,
    membership,
    analytics,
    aiContext,
  };
}

export function mapCustomerGroupToSegment(
  group: { id: string; name: string; slug: string; businessId: string; isSystem?: boolean },
  scope: CrmTenantScope,
  memberCount: number,
): CustomerSegment {
  return {
    id: group.id,
    slug: group.slug,
    name: group.name,
    description: `${group.name} customer segment`,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    memberCount,
    criteria: [],
    isSystem: group.isSystem,
  };
}
