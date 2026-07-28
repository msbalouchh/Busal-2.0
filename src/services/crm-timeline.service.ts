import "server-only";

import { type CustomerTimelineEventType, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function recordTimelineEvent(
  businessId: string,
  customerId: string,
  input: {
    staffId?: string | null;
    eventType: CustomerTimelineEventType;
    title: string;
    description?: string | null;
    metadata?: Prisma.InputJsonValue;
    orderId?: string | null;
    paymentId?: string | null;
  },
): Promise<void> {
  await prisma.customerTimelineEvent.create({
    data: {
      businessId,
      customerId,
      staffId: input.staffId ?? null,
      eventType: input.eventType,
      title: input.title,
      description: input.description ?? null,
      metadata: input.metadata,
      orderId: input.orderId ?? null,
      paymentId: input.paymentId ?? null,
    },
  });
}
