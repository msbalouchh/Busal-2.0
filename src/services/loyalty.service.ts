import "server-only";

import { type LoyaltyPointTransactionType, type RewardType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { logCrmAudit } from "@/modules/crm/utils/crm-audit";
import { moneyDecimalToPence } from "@/modules/payments/utils/currency";
import { recordTimelineEvent } from "@/services/crm-timeline.service";

export interface LoyaltyProgramData {
  businessId: string;
  isEnabled: boolean;
  earnPointsPerPound: number;
  redeemPointsPerPence: number;
  pointsExpiryDays: number | null;
}

export interface RewardData {
  id: string;
  name: string;
  type: RewardType;
  valuePence: number | null;
  percentageBps: number | null;
  menuItemId: string | null;
  pointsCost: number;
  isActive: boolean;
}

export interface LoyaltyPointTransactionData {
  id: string;
  type: LoyaltyPointTransactionType;
  pointsChange: number;
  balanceAfter: number;
  reason: string | null;
  createdAt: Date;
}

export async function getOrCreateLoyaltyProgram(businessId: string): Promise<LoyaltyProgramData> {
  const program = await prisma.loyaltyProgram.upsert({
    where: { businessId },
    create: { businessId },
    update: {},
  });

  return {
    businessId: program.businessId,
    isEnabled: program.isEnabled,
    earnPointsPerPound: program.earnPointsPerPound,
    redeemPointsPerPence: program.redeemPointsPerPence,
    pointsExpiryDays: program.pointsExpiryDays,
  };
}

export async function updateLoyaltyProgram(
  businessId: string,
  staffId: string | null,
  input: Partial<Omit<LoyaltyProgramData, "businessId">>,
): Promise<LoyaltyProgramData> {
  const program = await prisma.loyaltyProgram.upsert({
    where: { businessId },
    create: {
      businessId,
      isEnabled: input.isEnabled ?? true,
      earnPointsPerPound: input.earnPointsPerPound ?? 1,
      redeemPointsPerPence: input.redeemPointsPerPence ?? 100,
      pointsExpiryDays: input.pointsExpiryDays ?? null,
    },
    update: {
      isEnabled: input.isEnabled,
      earnPointsPerPound: input.earnPointsPerPound,
      redeemPointsPerPence: input.redeemPointsPerPence,
      pointsExpiryDays: input.pointsExpiryDays,
    },
  });

  await logCrmAudit(businessId, {
    staffId,
    entityType: "loyalty_program",
    entityId: businessId,
    action: "UPDATED",
  });

  return {
    businessId: program.businessId,
    isEnabled: program.isEnabled,
    earnPointsPerPound: program.earnPointsPerPound,
    redeemPointsPerPence: program.redeemPointsPerPence,
    pointsExpiryDays: program.pointsExpiryDays,
  };
}

function calculateEarnPoints(orderTotalPence: number, earnPointsPerPound: number): number {
  const wholePounds = Math.trunc(orderTotalPence / 100);

  return wholePounds * earnPointsPerPound;
}

export async function earnPointsForOrder(
  businessId: string,
  customerId: string,
  orderId: string,
  staffId: string | null,
): Promise<void> {
  const program = await getOrCreateLoyaltyProgram(businessId);

  if (!program.isEnabled) {
    return;
  }

  const existing = await prisma.loyaltyPointTransaction.findFirst({
    where: { businessId, customerId, orderId, type: "EARN" },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, businessId },
    select: { total: true },
  });

  if (!order) {
    return;
  }

  const orderTotalPence = moneyDecimalToPence(order.total);
  const pointsToEarn = calculateEarnPoints(orderTotalPence, program.earnPointsPerPound);

  if (pointsToEarn <= 0) {
    return;
  }

  await applyPointChange(businessId, customerId, {
    type: "EARN",
    pointsChange: pointsToEarn,
    orderId,
    staffId,
    reason: "Points earned from completed order",
    expiresAt: program.pointsExpiryDays
      ? new Date(Date.now() + program.pointsExpiryDays * 24 * 60 * 60 * 1000)
      : null,
  });
}

async function applyPointChange(
  businessId: string,
  customerId: string,
  input: {
    type: LoyaltyPointTransactionType;
    pointsChange: number;
    orderId?: string | null;
    staffId?: string | null;
    reason?: string | null;
    expiresAt?: Date | null;
  },
): Promise<LoyaltyPointTransactionData> {
  if (!Number.isInteger(input.pointsChange) || input.pointsChange === 0) {
    throw new Error("Points change must be a non-zero integer");
  }

  const transaction = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findFirst({
      where: { id: customerId, businessId, deletedAt: null },
      select: { id: true, loyaltyPoints: true },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    const balanceAfter = customer.loyaltyPoints + input.pointsChange;

    if (balanceAfter < 0) {
      throw new Error("Insufficient loyalty points");
    }

    await tx.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: balanceAfter },
    });

    return tx.loyaltyPointTransaction.create({
      data: {
        businessId,
        customerId,
        staffId: input.staffId ?? null,
        type: input.type,
        pointsChange: input.pointsChange,
        balanceAfter,
        orderId: input.orderId ?? null,
        reason: input.reason ?? null,
        expiresAt: input.expiresAt ?? null,
      },
    });
  });

  await recordTimelineEvent(businessId, customerId, {
    staffId: input.staffId ?? null,
    eventType: "LOYALTY",
    title: `Loyalty ${input.type.toLowerCase()}`,
    description: input.reason ?? `${input.pointsChange} points`,
    orderId: input.orderId ?? null,
  });

  return {
    id: transaction.id,
    type: transaction.type,
    pointsChange: transaction.pointsChange,
    balanceAfter: transaction.balanceAfter,
    reason: transaction.reason,
    createdAt: transaction.createdAt,
  };
}

export async function adjustLoyaltyPoints(
  businessId: string,
  customerId: string,
  staffId: string | null,
  pointsChange: number,
  reason: string,
): Promise<LoyaltyPointTransactionData> {
  return applyPointChange(businessId, customerId, {
    type: "ADJUSTMENT",
    pointsChange,
    staffId,
    reason,
  });
}

export async function listPointTransactions(
  customerId: string,
  businessId: string,
): Promise<LoyaltyPointTransactionData[]> {
  const transactions = await prisma.loyaltyPointTransaction.findMany({
    where: { customerId, businessId },
    orderBy: [{ createdAt: "desc" }],
    take: 50,
  });

  return transactions.map((transaction) => ({
    id: transaction.id,
    type: transaction.type,
    pointsChange: transaction.pointsChange,
    balanceAfter: transaction.balanceAfter,
    reason: transaction.reason,
    createdAt: transaction.createdAt,
  }));
}

export async function createReward(
  businessId: string,
  staffId: string | null,
  input: {
    name: string;
    type: RewardType;
    valuePence?: number | null;
    percentageBps?: number | null;
    menuItemId?: string | null;
    pointsCost?: number;
  },
): Promise<RewardData> {
  const reward = await prisma.reward.create({
    data: {
      businessId,
      name: input.name.trim(),
      type: input.type,
      valuePence: input.valuePence ?? null,
      percentageBps: input.percentageBps ?? null,
      menuItemId: input.menuItemId ?? null,
      pointsCost: input.pointsCost ?? 0,
    },
  });

  await logCrmAudit(businessId, {
    staffId,
    entityType: "reward",
    entityId: reward.id,
    action: "CREATED",
  });

  return reward;
}

export async function listRewards(businessId: string): Promise<RewardData[]> {
  return prisma.reward.findMany({
    where: { businessId, isActive: true },
    orderBy: [{ name: "asc" }],
  });
}

export async function redeemReward(
  businessId: string,
  customerId: string,
  rewardId: string,
  staffId: string | null,
  orderId?: string | null,
): Promise<void> {
  const reward = await prisma.reward.findFirst({
    where: { id: rewardId, businessId, isActive: true },
  });

  if (!reward) {
    throw new Error("Reward not found");
  }

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId, deletedAt: null },
    select: { loyaltyPoints: true },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  if (customer.loyaltyPoints < reward.pointsCost) {
    throw new Error("Insufficient loyalty points for reward");
  }

  if (reward.pointsCost > 0) {
    await applyPointChange(businessId, customerId, {
      type: "REDEEM",
      pointsChange: -reward.pointsCost,
      staffId,
      reason: `Redeemed reward: ${reward.name}`,
      orderId: orderId ?? null,
    });
  }

  await prisma.customerRewardRedemption.create({
    data: {
      businessId,
      customerId,
      rewardId,
      staffId,
      orderId: orderId ?? null,
    },
  });

  await recordTimelineEvent(businessId, customerId, {
    staffId,
    eventType: "REWARD",
    title: `Reward redeemed: ${reward.name}`,
    description: reward.type,
    orderId: orderId ?? null,
  });

  await logCrmAudit(businessId, {
    staffId,
    entityType: "reward_redemption",
    entityId: rewardId,
    action: "REDEEMED",
    metadata: { customerId },
  });
}

export { calculateEarnPoints };
