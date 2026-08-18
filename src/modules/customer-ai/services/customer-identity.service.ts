import "server-only";

import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";
import type { CustomerAiSessionContext } from "@/modules/customer-ai/types/customer-ai.types";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export async function createCustomerAiSession(input: {
  businessId: string;
  channel?: string;
  customerId?: string;
  verifiedEmail?: string;
  verifiedPhone?: string;
}): Promise<CustomerAiSessionContext> {
  const sessionToken = `cas_${randomBytes(24).toString("hex")}`;
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const session = await prisma.customerAiSession.create({
    data: {
      businessId: input.businessId,
      customerId: input.customerId ?? null,
      sessionToken,
      channel: input.channel ?? "website",
      verifiedEmail: input.verifiedEmail ?? null,
      verifiedPhone: input.verifiedPhone ?? null,
      expiresAt,
    },
  });

  return {
    sessionId: session.id,
    sessionToken: session.sessionToken,
    businessId: session.businessId,
    customerId: session.customerId,
    channel: session.channel as CustomerAiSessionContext["channel"],
    verifiedEmail: session.verifiedEmail,
    verifiedPhone: session.verifiedPhone,
  };
}

export async function resolveCustomerAiSession(
  sessionToken: string,
  businessId: string,
): Promise<CustomerAiSessionContext | null> {
  const session = await prisma.customerAiSession.findFirst({
    where: {
      sessionToken,
      businessId,
      expiresAt: { gt: new Date() },
    },
  });

  if (!session) return null;

  return {
    sessionId: session.id,
    sessionToken: session.sessionToken,
    businessId: session.businessId,
    customerId: session.customerId,
    channel: session.channel as CustomerAiSessionContext["channel"],
    verifiedEmail: session.verifiedEmail,
    verifiedPhone: session.verifiedPhone,
  };
}

/** Links a session to a verified customer — never trust prompt-provided IDs alone. */
export async function verifyCustomerIdentity(input: {
  businessId: string;
  sessionToken: string;
  email?: string;
  phone?: string;
  orderReference?: string;
}): Promise<{ customerId: string | null; verified: boolean }> {
  const session = await resolveCustomerAiSession(input.sessionToken, input.businessId);
  if (!session) {
    return { customerId: null, verified: false };
  }

  let customerId: string | null = session.customerId;

  if (input.email) {
    const customer = await prisma.customer.findFirst({
      where: {
        businessId: input.businessId,
        email: { equals: input.email.trim(), mode: "insensitive" },
        deletedAt: null,
      },
      select: { id: true },
    });
    if (customer) customerId = customer.id;
  }

  if (!customerId && input.phone) {
    const customer = await prisma.customer.findFirst({
      where: {
        businessId: input.businessId,
        phone: input.phone.trim(),
        deletedAt: null,
      },
      select: { id: true },
    });
    if (customer) customerId = customer.id;
  }

  if (!customerId && input.orderReference) {
    const order = await prisma.restaurantOrder.findFirst({
      where: {
        businessId: input.businessId,
        OR: [
          { orderNumber: input.orderReference.trim() },
          { id: input.orderReference.trim() },
        ],
      },
      select: { customerId: true },
    });
    if (order?.customerId) customerId = order.customerId;
  }

  if (customerId) {
    await prisma.customerAiSession.update({
      where: { sessionToken: input.sessionToken },
      data: {
        customerId,
        verifiedEmail: input.email ?? session.verifiedEmail,
        verifiedPhone: input.phone ?? session.verifiedPhone,
      },
    });
  }

  return { customerId, verified: Boolean(customerId) };
}

export async function assertCustomerDataAccess(input: {
  businessId: string;
  customerId: string;
  sessionToken: string;
}): Promise<boolean> {
  const session = await resolveCustomerAiSession(input.sessionToken, input.businessId);
  return session?.customerId === input.customerId;
}
