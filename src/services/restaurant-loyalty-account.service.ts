import "server-only";

import type { LoyaltyAccount, LoyaltyTier } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  calculateTierFromLifetimePoints,
  validateLoyaltyPoints,
} from "@/modules/customer-crm-management/lib/customer-crm-validation";
import type {
  LoyaltyAccountRecord,
  LoyaltyTransactionRecord,
} from "@/modules/customer-crm-management/types/customer-crm-types";
import { recordTimelineEvent } from "@/services/crm-timeline.service";

export function serializeLoyaltyAccount(account: LoyaltyAccount): LoyaltyAccountRecord {
  return {
    id: account.id,
    membershipNumber: account.membershipNumber,
    tier: account.tier,
    pointsBalance: account.pointsBalance,
    lifetimePoints: account.lifetimePoints,
    totalRedeemedPoints: account.totalRedeemedPoints,
    joinedAt: account.joinedAt.toISOString(),
  };
}

export async function ensureLoyaltyAccount(
  customerId: string,
  membershipNumber: string,
): Promise<LoyaltyAccountRecord> {
  const account = await prisma.loyaltyAccount.upsert({
    where: { customerId },
    create: { customerId, membershipNumber },
    update: {},
  });

  return serializeLoyaltyAccount(account);
}

async function applyLoyaltyChange(
  customerId: string,
  businessId: string,
  input: {
    type: "EARN" | "REDEEM" | "ADJUSTMENT" | "EXPIRE";
    points: number;
    reference?: string | null;
    notes?: string | null;
  },
): Promise<LoyaltyTransactionRecord> {
  validateLoyaltyPoints(input.points);

  const transaction = await prisma.$transaction(async (tx) => {
    const account = await tx.loyaltyAccount.findUnique({ where: { customerId } });
    if (!account) throw new Error("Loyalty account not found");

    const signedPoints =
      input.type === "REDEEM" || input.type === "EXPIRE"
        ? -Math.abs(input.points)
        : Math.abs(input.points);

    const nextBalance = account.pointsBalance + signedPoints;
    if (nextBalance < 0) throw new Error("Insufficient loyalty points");

    const lifetimePoints =
      input.type === "EARN" ? account.lifetimePoints + signedPoints : account.lifetimePoints;
    const totalRedeemed =
      input.type === "REDEEM"
        ? account.totalRedeemedPoints + Math.abs(signedPoints)
        : account.totalRedeemedPoints;
    const tier = calculateTierFromLifetimePoints(lifetimePoints);

    await tx.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        pointsBalance: nextBalance,
        lifetimePoints,
        totalRedeemedPoints: totalRedeemed,
        tier,
      },
    });

    await tx.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: nextBalance },
    });

    return tx.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: account.id,
        type: input.type,
        points: signedPoints,
        reference: input.reference?.trim() || null,
        notes: input.notes?.trim() || null,
      },
    });
  });

  await recordTimelineEvent(businessId, customerId, {
    staffId: null,
    eventType: "LOYALTY",
    title: `Loyalty ${input.type.toLowerCase()}`,
    description: input.notes ?? `${transaction.points} points`,
  });

  return {
    id: transaction.id,
    type: transaction.type,
    points: transaction.points,
    reference: transaction.reference,
    notes: transaction.notes,
    createdAt: transaction.createdAt.toISOString(),
  };
}

export async function earnLoyaltyPointsForOrder(
  businessId: string,
  customerId: string,
  orderId: string,
  orderTotal: number,
): Promise<void> {
  const existing = await prisma.loyaltyTransaction.findFirst({
    where: {
      reference: orderId,
      type: "EARN",
      loyaltyAccount: { customerId },
    },
  });

  if (existing) return;

  const points = Math.floor(orderTotal);
  if (points <= 0) return;

  await applyLoyaltyChange(customerId, businessId, {
    type: "EARN",
    points,
    reference: orderId,
    notes: `Points earned from order ${orderId}`,
  });
}

export async function redeemLoyaltyPoints(
  ownerId: string,
  customerId: string,
  points: number,
  notes?: string,
): Promise<LoyaltyTransactionRecord> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, deletedAt: null },
    select: { businessId: true },
  });

  if (!customer) throw new Error("Customer not found");

  return applyLoyaltyChange(customerId, customer.businessId, {
    type: "REDEEM",
    points,
    notes: notes ?? "Points redeemed",
  });
}

export async function adjustLoyaltyPoints(
  ownerId: string,
  customerId: string,
  points: number,
  notes?: string,
): Promise<LoyaltyTransactionRecord> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, deletedAt: null },
    select: { businessId: true },
  });

  if (!customer) throw new Error("Customer not found");

  return applyLoyaltyChange(customerId, customer.businessId, {
    type: "ADJUSTMENT",
    points,
    notes: notes ?? "Manual adjustment",
  });
}

export async function getLoyaltyTransactions(
  customerId: string,
): Promise<LoyaltyTransactionRecord[]> {
  const account = await prisma.loyaltyAccount.findUnique({ where: { customerId } });
  if (!account) return [];

  const transactions = await prisma.loyaltyTransaction.findMany({
    where: { loyaltyAccountId: account.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return transactions.map((t) => ({
    id: t.id,
    type: t.type,
    points: t.points,
    reference: t.reference,
    notes: t.notes,
    createdAt: t.createdAt.toISOString(),
  }));
}

export async function updateLoyaltyTier(
  customerId: string,
  tier: LoyaltyTier,
): Promise<LoyaltyAccountRecord> {
  const account = await prisma.loyaltyAccount.update({
    where: { customerId },
    data: { tier },
  });

  return serializeLoyaltyAccount(account);
}
