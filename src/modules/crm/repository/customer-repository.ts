import { CUSTOMER_STATUSES, TIMELINE_EVENT_TYPES } from "@/modules/crm/constants/customer-status";
import {
  DEFAULT_CRM_SCOPE,
  MOCK_CRM_SEGMENTS,
  MOCK_CRM_TAGS,
  MOCK_CUSTOMER_RECORDS,
} from "@/modules/crm/constants/mock-data";
import type {
  CreateCustomerInput,
  CustomerRecord,
  CustomerSearchQuery,
  UpdateCustomerInput,
} from "@/modules/crm/types/customer";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** In-memory customer repository (mock only, no backend). */
export class CustomerRepository {
  private records: CustomerRecord[] = [...MOCK_CUSTOMER_RECORDS];

  list(): CustomerRecord[] {
    return [...this.records];
  }

  findById(customerId: string): CustomerRecord | undefined {
    return this.records.find((record) => record.customer.id === customerId);
  }

  search(query: CustomerSearchQuery = {}): CustomerRecord[] {
    let results = this.records;

    if (query.tenantId) {
      results = results.filter((record) => record.customer.tenantId === query.tenantId);
    }

    if (query.businessId) {
      results = results.filter((record) => record.customer.businessId === query.businessId);
    }

    if (query.branchId) {
      results = results.filter((record) => record.customer.branchId === query.branchId);
    }

    if (query.status) {
      results = results.filter((record) => record.customer.status === query.status);
    }

    if (query.segmentId) {
      results = results.filter((record) => record.customer.segmentIds.includes(query.segmentId!));
    }

    if (query.tagId) {
      results = results.filter((record) => record.customer.tagIds.includes(query.tagId!));
    }

    if (query.query) {
      const normalized = query.query.toLowerCase();

      results = results.filter((record) => {
        const haystack = [
          record.profile.displayName,
          record.profile.email ?? "",
          record.profile.phone ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalized);
      });
    }

    const limit = query.limit ?? results.length;
    return results.slice(0, limit);
  }

  create(input: CreateCustomerInput): CustomerRecord {
    const id = createId("cust");
    const now = new Date().toISOString();
    const displayName = `${input.firstName} ${input.lastName}`.trim();

    const record: CustomerRecord = {
      customer: {
        id,
        tenantId: input.tenantId,
        workspaceId: input.workspaceId,
        businessId: input.businessId,
        branchId: input.branchId ?? null,
        externalId: null,
        status: input.status ?? CUSTOMER_STATUSES.PROSPECT,
        segmentIds: input.segmentIds ?? [],
        tagIds: input.tagIds ?? [],
        createdAt: now,
        updatedAt: now,
      },
      profile: {
        customerId: id,
        firstName: input.firstName,
        lastName: input.lastName,
        displayName,
        email: input.email ?? null,
        phone: input.phone ?? null,
        dateOfBirth: null,
        avatarUrl: null,
        preferredLanguage: "en-GB",
        timezone: "Europe/London",
      },
      timeline: [
        {
          id: createId("tl"),
          customerId: id,
          type: TIMELINE_EVENT_TYPES.CREATED,
          title: "Customer created",
          description: `${displayName} added to CRM.`,
          metadata: {},
          occurredAt: now,
          createdBy: DEFAULT_CRM_SCOPE.userId,
        },
      ],
      notes: [],
      tags: MOCK_CRM_TAGS.filter((tag) => (input.tagIds ?? []).includes(tag.id)),
      segments: MOCK_CRM_SEGMENTS.filter((segment) =>
        (input.segmentIds ?? []).includes(segment.id),
      ),
      addresses: [],
      communications: [],
      preferences: {
        customerId: id,
        marketingOptIn: false,
        smsOptIn: false,
        emailOptIn: true,
        preferredContactChannel: "email",
        dietaryRestrictions: [],
        seatingPreference: null,
      },
      loyalty: {
        customerId: id,
        pointsBalance: 0,
        lifetimePoints: 0,
        tier: "bronze",
        rewardsRedeemed: 0,
        lastEarnedAt: null,
      },
      wallet: {
        customerId: id,
        balancePence: 0,
        currency: "GBP",
        giftCardBalancePence: 0,
        lastTransactionAt: null,
      },
      membership: {
        customerId: id,
        tier: "bronze",
        memberSince: now,
        expiresAt: null,
        benefits: [],
        isActive: true,
      },
      analytics: {
        customerId: id,
        totalOrders: 0,
        totalSpentPence: 0,
        averageOrderValuePence: 0,
        lastOrderAt: null,
        visitCount: 0,
        lifetimeValuePence: 0,
        churnRiskScore: 0.5,
      },
      aiContext: {
        customerId: id,
        summary: `New prospect: ${displayName}.`,
        insights: [],
        recommendedActions: ["Send welcome email.", "Assign to onboarding segment."],
        sentiment: "neutral",
        lastGeneratedAt: now,
      },
    };

    this.records.push(record);
    return record;
  }

  update(input: UpdateCustomerInput): CustomerRecord | undefined {
    const record = this.findById(input.customerId);

    if (!record) {
      return undefined;
    }

    const now = new Date().toISOString();

    if (input.firstName) record.profile.firstName = input.firstName;
    if (input.lastName) record.profile.lastName = input.lastName;
    if (input.email !== undefined) record.profile.email = input.email;
    if (input.phone !== undefined) record.profile.phone = input.phone;
    if (input.status) record.customer.status = input.status;
    if (input.tagIds) {
      record.customer.tagIds = input.tagIds;
      record.tags = MOCK_CRM_TAGS.filter((tag) => input.tagIds!.includes(tag.id));
    }
    if (input.segmentIds) {
      record.customer.segmentIds = input.segmentIds;
      record.segments = MOCK_CRM_SEGMENTS.filter((segment) =>
        input.segmentIds!.includes(segment.id),
      );
    }

    record.profile.displayName = `${record.profile.firstName} ${record.profile.lastName}`.trim();
    record.customer.updatedAt = now;

    record.timeline.unshift({
      id: createId("tl"),
      customerId: record.customer.id,
      type: TIMELINE_EVENT_TYPES.NOTE,
      title: "Profile updated",
      description: "Customer record updated.",
      metadata: {},
      occurredAt: now,
      createdBy: DEFAULT_CRM_SCOPE.userId,
    });

    return record;
  }

  getTags() {
    return MOCK_CRM_TAGS;
  }

  getSegments(businessId?: string) {
    if (!businessId) return MOCK_CRM_SEGMENTS;
    return MOCK_CRM_SEGMENTS.filter((segment) => segment.businessId === businessId);
  }
}

export const customerRepository = new CustomerRepository();
