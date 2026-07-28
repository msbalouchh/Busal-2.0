import type { Prisma } from "@prisma/client";

import type { SearchConversationsInput } from "@/modules/communication/types/communication-types";

export function buildConversationSearchWhere(
  businessId: string,
  input: SearchConversationsInput,
): Prisma.CommunicationConversationWhereInput {
  const conditions: Prisma.CommunicationConversationWhereInput[] = [{ businessId }];

  if (input.customerId) {
    conditions.push({ customerId: input.customerId });
  }

  if (input.channel) {
    conditions.push({ sourceChannel: input.channel });
  }

  if (input.tags && input.tags.length > 0) {
    conditions.push({ tags: { hasSome: input.tags } });
  }

  if (input.dateFrom || input.dateTo) {
    conditions.push({
      lastMessageAt: {
        ...(input.dateFrom ? { gte: input.dateFrom } : {}),
        ...(input.dateTo ? { lte: input.dateTo } : {}),
      },
    });
  }

  if (input.phone || input.email) {
    conditions.push({
      OR: [
        ...(input.phone
          ? [{ contact: { phone: { contains: input.phone, mode: "insensitive" as const } } }]
          : []),
        ...(input.email
          ? [{ contact: { email: { contains: input.email, mode: "insensitive" as const } } }]
          : []),
        ...(input.phone
          ? [{ customer: { phone: { contains: input.phone, mode: "insensitive" as const } } }]
          : []),
        ...(input.email
          ? [{ customer: { email: { contains: input.email, mode: "insensitive" as const } } }]
          : []),
      ],
    });
  }

  if (input.query) {
    conditions.push({
      OR: [
        { subject: { contains: input.query, mode: "insensitive" } },
        { tags: { has: input.query } },
        {
          messages: {
            some: { body: { contains: input.query, mode: "insensitive" } },
          },
        },
        { contact: { name: { contains: input.query, mode: "insensitive" } } },
        { customer: { name: { contains: input.query, mode: "insensitive" } } },
      ],
    });
  }

  return { AND: conditions };
}
