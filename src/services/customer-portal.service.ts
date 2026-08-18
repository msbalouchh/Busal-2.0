import "server-only";

import type {
  CustomerStatus,
  NotificationChannel,
  NotificationDigestFrequency,
  Prisma,
  RewardType,
} from "@prisma/client";

import { USER_ROLES } from "@/constants/roles";
import { prisma } from "@/lib/prisma";
import { redeemReward } from "@/services/loyalty.service";
import { AuthServiceError, signInWithEmail, signUpWithEmail } from "@/services/auth.service";
import { getUserProfile } from "@/services/user.service";

export class CustomerPortalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomerPortalError";
  }
}

function decimal(value: Prisma.Decimal | number | string): number {
  return Number(value);
}

function formatMoney(amount: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export interface CustomerPortalBusinessSummary {
  id: string;
  businessName: string;
  businessCode: string | null;
  currency: string;
}

export interface CustomerPortalProfile {
  id: string;
  businessId: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: CustomerStatus;
  loyaltyPoints: number;
  totalOrders: number;
  totalSpend: number;
  totalSpendFormatted: string;
  averageOrderValue: number;
  averageOrderValueFormatted: string;
  lastOrderAt: string | null;
  marketingConsent: boolean;
  preferredLanguage: string | null;
  profileImage: string | null;
}

export interface CustomerPortalContextData {
  userId: string;
  userEmail: string;
  userFullName: string;
  customer: CustomerPortalProfile;
  business: CustomerPortalBusinessSummary;
  memberships: Array<{ businessId: string; businessName: string; customerId: string }>;
}

async function loadCustomerRecord(userId: string, businessId: string) {
  const customer = await prisma.customer.findFirst({
    where: { userId, businessId, deletedAt: null },
    include: {
      business: {
        select: {
          id: true,
          businessName: true,
          businessCode: true,
          currency: true,
        },
      },
    },
  });

  if (customer) {
    return customer;
  }

  const user = await getUserProfile(userId);
  if (!user?.email) {
    return null;
  }

  const byEmail = await prisma.customer.findFirst({
    where: {
      businessId,
      email: { equals: normalizeEmail(user.email), mode: "insensitive" },
      deletedAt: null,
    },
    include: {
      business: {
        select: {
          id: true,
          businessName: true,
          businessCode: true,
          currency: true,
        },
      },
    },
  });

  if (!byEmail) {
    return null;
  }

  if (!byEmail.userId) {
    return prisma.customer.update({
      where: { id: byEmail.id },
      data: { userId },
      include: {
        business: {
          select: {
            id: true,
            businessName: true,
            businessCode: true,
            currency: true,
          },
        },
      },
    });
  }

  return byEmail.userId === userId ? byEmail : null;
}

export async function listCustomerMemberships(userId: string) {
  const customers = await prisma.customer.findMany({
    where: { userId, deletedAt: null },
    include: { business: { select: { id: true, businessName: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return customers.map((entry) => ({
    businessId: entry.businessId,
    businessName: entry.business.businessName?.trim() || "Restaurant",
    customerId: entry.id,
  }));
}

export async function resolveCustomerPortalContext(
  userId: string,
  userEmail: string,
  userFullName: string,
  preferredBusinessId?: string | null,
): Promise<CustomerPortalContextData> {
  const memberships = await listCustomerMemberships(userId);

  if (memberships.length === 0) {
    throw new CustomerPortalError("No customer profile linked to this account.");
  }

  const businessId =
    preferredBusinessId && memberships.some((m) => m.businessId === preferredBusinessId)
      ? preferredBusinessId
      : memberships[0]?.businessId;

  if (!businessId) {
    throw new CustomerPortalError("Unable to resolve customer business.");
  }

  const customer = await loadCustomerRecord(userId, businessId);
  if (!customer) {
    throw new CustomerPortalError("Customer profile not found.");
  }

  const currency = customer.business.currency ?? "GBP";
  const totalSpend = decimal(customer.totalSpend);
  const averageOrderValue = decimal(customer.averageOrderValue);

  return {
    userId,
    userEmail,
    userFullName,
    customer: {
      id: customer.id,
      businessId: customer.businessId,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      loyaltyPoints: customer.loyaltyPoints,
      totalOrders: customer.totalOrders,
      totalSpend,
      totalSpendFormatted: formatMoney(totalSpend, currency),
      averageOrderValue,
      averageOrderValueFormatted: formatMoney(averageOrderValue, currency),
      lastOrderAt: customer.lastOrderAt?.toISOString() ?? null,
      marketingConsent: customer.marketingConsent,
      preferredLanguage: customer.preferredLanguage,
      profileImage: customer.profileImage,
    },
    business: {
      id: customer.business.id,
      businessName: customer.business.businessName?.trim() || "Restaurant",
      businessCode: customer.business.businessCode,
      currency: customer.business.currency ?? "GBP",
    },
    memberships,
  };
}

export async function registerCustomerPortalAccount(input: {
  fullName: string;
  email: string;
  password: string;
  businessCode: string;
  phone?: string | null;
}) {
  const business = await prisma.business.findFirst({
    where: {
      businessCode: { equals: input.businessCode.trim(), mode: "insensitive" },
      onboardingCompleted: true,
    },
    select: { id: true, businessName: true, currency: true },
  });

  if (!business) {
    throw new CustomerPortalError("Business not found. Check your business code.");
  }

  const email = normalizeEmail(input.email);
  const existingCustomer = await prisma.customer.findFirst({
    where: { businessId: business.id, email, deletedAt: null },
  });

  if (existingCustomer?.userId) {
    throw new CustomerPortalError("An account already exists for this email at this business.");
  }

  const signup = await signUpWithEmail(input.fullName.trim(), email, input.password, {
    role: USER_ROLES.CUSTOMER,
  });

  if (!signup.session?.user) {
    throw new CustomerPortalError("Check your email to confirm your account before signing in.");
  }

  const userId = signup.session.user.id;

  const customer =
    existingCustomer ??
    (await prisma.customer.create({
      data: {
        businessId: business.id,
        userId,
        name: input.fullName.trim(),
        fullName: input.fullName.trim(),
        email,
        phone: input.phone?.trim() || null,
        status: "ACTIVE",
      },
    }));

  if (!existingCustomer) {
    await prisma.customer.update({
      where: { id: customer.id },
      data: { userId },
    });
  } else {
    await prisma.customer.update({
      where: { id: existingCustomer.id },
      data: {
        userId,
        name: input.fullName.trim(),
        fullName: input.fullName.trim(),
        phone: input.phone?.trim() || existingCustomer.phone,
      },
    });
  }

  return {
    session: signup.session,
    businessId: business.id,
    customerId: existingCustomer?.id ?? customer.id,
  };
}

export async function loginCustomerPortalAccount(email: string, password: string) {
  const session = await signInWithEmail(email, password);

  if (session.user.role !== USER_ROLES.CUSTOMER) {
    const memberships = await listCustomerMemberships(session.user.id);
    if (memberships.length === 0) {
      throw new AuthServiceError("This account is not registered as a customer.", "UNAUTHORIZED");
    }
  }

  const memberships = await listCustomerMemberships(session.user.id);
  if (memberships.length === 0) {
    throw new CustomerPortalError("No customer profile linked to this account.");
  }

  return { session, businessId: memberships[0]?.businessId ?? null };
}

export async function getCustomerDashboard(userId: string, businessId: string, customerId: string) {
  const [recentOrders, upcomingReservations, unreadNotifications, loyaltyAccount, activeRewards] =
    await Promise.all([
      prisma.restaurantOrder.findMany({
        where: { businessId, customerId },
        orderBy: { placedAt: "desc" },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          placedAt: true,
        },
      }),
      prisma.reservation.findMany({
        where: {
          businessId,
          customerId,
          reservationDate: { gte: new Date() },
          status: { in: ["CONFIRMED", "PENDING", "SEATED"] },
        },
        orderBy: { reservationDate: "asc" },
        take: 5,
        select: {
          id: true,
          reservationNumber: true,
          reservationDate: true,
          partySize: true,
          status: true,
        },
      }),
      prisma.notificationInboxItem.count({
        where: { userId, businessId, status: "UNREAD" },
      }),
      prisma.loyaltyAccount.findUnique({ where: { customerId } }),
      prisma.reward.count({ where: { businessId, isActive: true } }),
    ]);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { currency: true },
  });
  const currency = business?.currency ?? "GBP";

  return {
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: decimal(order.totalAmount),
      totalAmountFormatted: formatMoney(decimal(order.totalAmount), currency),
      placedAt: order.placedAt.toISOString(),
    })),
    upcomingReservations: upcomingReservations.map((reservation) => ({
      id: reservation.id,
      reservationNumber: reservation.reservationNumber,
      scheduledAt: reservation.reservationDate.toISOString(),
      partySize: reservation.partySize,
      status: reservation.status,
    })),
    unreadNotifications,
    loyaltyPoints: loyaltyAccount?.pointsBalance ?? 0,
    loyaltyTier: loyaltyAccount?.tier ?? "BRONZE",
    activeRewardsCount: activeRewards,
  };
}

export async function listCustomerOrders(businessId: string, customerId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { currency: true },
  });
  const currency = business?.currency ?? "GBP";

  const orders = await prisma.restaurantOrder.findMany({
    where: { businessId, customerId },
    orderBy: { placedAt: "desc" },
    take: 100,
    select: {
      id: true,
      orderNumber: true,
      orderType: true,
      status: true,
      paymentStatus: true,
      totalAmount: true,
      placedAt: true,
    },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    orderType: order.orderType,
    status: order.status,
    paymentStatus: order.paymentStatus,
    totalAmount: decimal(order.totalAmount),
    totalAmountFormatted: formatMoney(decimal(order.totalAmount), currency),
    placedAt: order.placedAt.toISOString(),
  }));
}

export async function getCustomerOrderDetail(
  businessId: string,
  customerId: string,
  orderId: string,
) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { currency: true, businessName: true },
  });
  const currency = business?.currency ?? "GBP";

  const order = await prisma.restaurantOrder.findFirst({
    where: { id: orderId, businessId, customerId },
    include: {
      items: {
        include: { modifiers: true },
        orderBy: { createdAt: "asc" },
      },
      payments: {
        include: { receipt: true },
        orderBy: { paidAt: "desc" },
      },
      branch: { select: { name: true } },
    },
  });

  if (!order) {
    throw new CustomerPortalError("Order not found.");
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    orderType: order.orderType,
    status: order.status,
    paymentStatus: order.paymentStatus,
    notes: order.notes,
    branchName: order.branch.name,
    businessName: business?.businessName ?? "",
    subtotal: decimal(order.subtotal),
    discountAmount: decimal(order.discountAmount),
    taxAmount: decimal(order.taxAmount),
    serviceCharge: decimal(order.serviceCharge),
    deliveryCharge: decimal(order.deliveryCharge),
    tipAmount: decimal(order.tipAmount),
    totalAmount: decimal(order.totalAmount),
    totalAmountFormatted: formatMoney(decimal(order.totalAmount), currency),
    placedAt: order.placedAt.toISOString(),
    completedAt: order.completedAt?.toISOString() ?? null,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productNameSnapshot,
      quantity: item.quantity,
      unitPrice: decimal(item.unitPrice),
      totalAmount: decimal(item.totalAmount),
      modifiers: item.modifiers.map((modifier) => ({
        id: modifier.id,
        name: modifier.nameSnapshot,
        priceAdjustment: decimal(modifier.priceAdjustment),
      })),
    })),
    payments: order.payments.map((payment) => ({
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      paymentMethod: payment.paymentMethod,
      amountPaid: decimal(payment.amountPaid),
      amountPaidFormatted: formatMoney(decimal(payment.amountPaid), currency),
      paidAt: payment.paidAt?.toISOString() ?? null,
      receiptId: payment.receipt?.id ?? null,
      receiptNumber: payment.receipt?.receiptNumber ?? null,
    })),
  };
}

export async function listCustomerReservations(businessId: string, customerId: string) {
  const reservations = await prisma.reservation.findMany({
    where: { businessId, customerId },
    orderBy: { reservationDate: "desc" },
    take: 100,
    include: { branch: { select: { name: true } } },
  });

  return reservations.map((reservation) => ({
    id: reservation.id,
    reservationNumber: reservation.reservationNumber,
    status: reservation.status,
    partySize: reservation.partySize,
    branchName: reservation.branch.name,
    scheduledAt: reservation.reservationDate.toISOString(),
    specialRequests: reservation.specialRequests,
  }));
}

export async function getCustomerReservationDetail(
  businessId: string,
  customerId: string,
  reservationId: string,
) {
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, businessId, customerId },
    include: {
      branch: { select: { name: true, address: true } },
      restaurantTable: { select: { tableNumber: true } },
    },
  });

  if (!reservation) {
    throw new CustomerPortalError("Reservation not found.");
  }

  return {
    id: reservation.id,
    reservationNumber: reservation.reservationNumber,
    status: reservation.status,
    partySize: reservation.partySize,
    branchName: reservation.branch.name,
    branchAddress: reservation.branch.address,
    tableNumber: reservation.restaurantTable?.tableNumber ?? null,
    scheduledAt: reservation.reservationDate.toISOString(),
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    specialRequests: reservation.specialRequests,
    guestName: reservation.guestName,
    guestPhone: reservation.guestPhone,
    guestEmail: reservation.guestEmail,
  };
}

export async function getCustomerLoyaltyDashboard(businessId: string, customerId: string) {
  const [customer, loyaltyAccount, transactions, redemptions] = await Promise.all([
    prisma.customer.findFirst({
      where: { id: customerId, businessId },
      select: { loyaltyPoints: true },
    }),
    prisma.loyaltyAccount.findUnique({ where: { customerId } }),
    prisma.loyaltyPointTransaction.findMany({
      where: { customerId, businessId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.customerRewardRedemption.findMany({
      where: { customerId, businessId },
      include: { reward: { select: { name: true, type: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return {
    pointsBalance: loyaltyAccount?.pointsBalance ?? customer?.loyaltyPoints ?? 0,
    tier: loyaltyAccount?.tier ?? "BRONZE",
    lifetimePoints: loyaltyAccount?.lifetimePoints ?? 0,
    totalRedeemedPoints: loyaltyAccount?.totalRedeemedPoints ?? 0,
    membershipNumber: loyaltyAccount?.membershipNumber ?? null,
    transactions: transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      pointsChange: tx.pointsChange,
      balanceAfter: tx.balanceAfter,
      reason: tx.reason,
      createdAt: tx.createdAt.toISOString(),
    })),
    redemptions: redemptions.map((entry) => ({
      id: entry.id,
      rewardName: entry.reward.name,
      rewardType: entry.reward.type,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}

export async function listCustomerRewards(businessId: string, customerId: string) {
  const [rewards, customer] = await Promise.all([
    prisma.reward.findMany({
      where: { businessId, isActive: true },
      orderBy: [{ pointsCost: "asc" }, { name: "asc" }],
    }),
    prisma.customer.findFirst({
      where: { id: customerId, businessId },
      select: { loyaltyPoints: true },
    }),
  ]);

  const points = customer?.loyaltyPoints ?? 0;

  return rewards.map((reward) => ({
    id: reward.id,
    name: reward.name,
    type: reward.type,
    pointsCost: reward.pointsCost,
    valuePence: reward.valuePence,
    percentageBps: reward.percentageBps,
    canRedeem: points >= reward.pointsCost,
  }));
}

export async function redeemCustomerReward(
  businessId: string,
  customerId: string,
  rewardId: string,
) {
  await redeemReward(businessId, customerId, rewardId, null);
}

export async function getCustomerWallet(businessId: string, customerId: string) {
  const [loyaltyAccount, redemptions] = await Promise.all([
    prisma.loyaltyAccount.findUnique({ where: { customerId } }),
    prisma.customerRewardRedemption.findMany({
      where: { customerId, businessId },
      include: { reward: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { currency: true },
  });
  const currency = business?.currency ?? "GBP";

  const voucherValuePence = redemptions.reduce((sum, entry) => {
    if (entry.reward.type === "VOUCHER" && entry.reward.valuePence) {
      return sum + entry.reward.valuePence;
    }
    return sum;
  }, 0);

  return {
    pointsBalance: loyaltyAccount?.pointsBalance ?? 0,
    estimatedValueFormatted: formatMoney((loyaltyAccount?.pointsBalance ?? 0) / 100, currency),
    voucherBalanceFormatted: formatMoney(voucherValuePence / 100, currency),
    recentActivity: redemptions.map((entry) => ({
      id: entry.id,
      label: entry.reward.name,
      type: entry.reward.type,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}

export async function listCustomerGiftCards(businessId: string, customerId: string) {
  const redemptions = await prisma.customerRewardRedemption.findMany({
    where: {
      customerId,
      businessId,
      reward: { type: "VOUCHER" },
    },
    include: { reward: true },
    orderBy: { createdAt: "desc" },
  });

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { currency: true },
  });
  const currency = business?.currency ?? "GBP";

  return redemptions.map((entry) => ({
    id: entry.id,
    name: entry.reward.name,
    valueFormatted: entry.reward.valuePence
      ? formatMoney(entry.reward.valuePence / 100, currency)
      : null,
    redeemedAt: entry.createdAt.toISOString(),
  }));
}

export async function listCustomerCoupons(businessId: string) {
  const couponTypes: RewardType[] = ["FIXED_DISCOUNT", "PERCENTAGE_DISCOUNT", "VOUCHER"];
  const rewards = await prisma.reward.findMany({
    where: { businessId, isActive: true, type: { in: couponTypes } },
    orderBy: { name: "asc" },
  });

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { currency: true },
  });
  const currency = business?.currency ?? "GBP";

  return rewards.map((reward) => ({
    id: reward.id,
    name: reward.name,
    type: reward.type,
    pointsCost: reward.pointsCost,
    valueFormatted:
      reward.valuePence != null ? formatMoney(reward.valuePence / 100, currency) : null,
    percentage: reward.percentageBps != null ? reward.percentageBps / 100 : null,
  }));
}

export async function listCustomerAddresses(customerId: string) {
  const addresses = await prisma.customerAddress.findMany({
    where: { customerId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return addresses.map((address) => ({
    id: address.id,
    label: address.label,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    postcode: address.postcode,
    country: address.country,
    isDefault: address.isDefault,
  }));
}

export async function upsertCustomerPortalAddress(
  customerId: string,
  input: {
    label?: string | null;
    addressLine1: string;
    addressLine2?: string | null;
    city?: string | null;
    postcode?: string | null;
    country?: string | null;
    isDefault?: boolean;
  },
  addressId?: string,
) {
  if (input.isDefault) {
    await prisma.customerAddress.updateMany({
      where: { customerId },
      data: { isDefault: false },
    });
  }

  const data = {
    label: input.label?.trim() || null,
    addressLine1: input.addressLine1.trim(),
    addressLine2: input.addressLine2?.trim() || null,
    city: input.city?.trim() || null,
    postcode: input.postcode?.trim() || null,
    country: input.country?.trim() || null,
    isDefault: input.isDefault ?? false,
  };

  if (addressId) {
    return prisma.customerAddress.update({
      where: { id: addressId, customerId },
      data,
    });
  }

  return prisma.customerAddress.create({ data: { ...data, customerId } });
}

export async function deleteCustomerPortalAddress(customerId: string, addressId: string) {
  await prisma.customerAddress.deleteMany({ where: { id: addressId, customerId } });
}

export async function listCustomerPaymentMethods(businessId: string, customerId: string) {
  const payments = await prisma.orderPayment.findMany({
    where: { order: { businessId, customerId } },
    orderBy: { paidAt: "desc" },
    take: 50,
    select: {
      id: true,
      paymentMethod: true,
      paymentNumber: true,
      amountPaid: true,
      paidAt: true,
    },
  });

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { currency: true },
  });
  const currency = business?.currency ?? "GBP";

  const methods = new Map<
    string,
    { method: string; lastUsedAt: string; usageCount: number; lastAmountFormatted: string }
  >();

  for (const payment of payments) {
    const key = payment.paymentMethod ?? "UNKNOWN";
    const existing = methods.get(key);
    const paidAt = payment.paidAt?.toISOString() ?? new Date().toISOString();
    if (!existing) {
      methods.set(key, {
        method: key,
        lastUsedAt: paidAt,
        usageCount: 1,
        lastAmountFormatted: formatMoney(decimal(payment.amountPaid), currency),
      });
    } else {
      existing.usageCount += 1;
    }
  }

  return {
    savedMethods: Array.from(methods.values()),
    recentPayments: payments.map((payment) => ({
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      paymentMethod: payment.paymentMethod,
      amountPaidFormatted: formatMoney(decimal(payment.amountPaid), currency),
      paidAt: payment.paidAt?.toISOString() ?? null,
    })),
  };
}

export async function listCustomerNotifications(userId: string, businessId: string) {
  const items = await prisma.notificationInboxItem.findMany({
    where: { userId, businessId },
    include: { notification: true },
    orderBy: [{ pinnedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return items.map((item) => ({
    id: item.id,
    title: item.notification.title,
    body: item.notification.body,
    category: item.notification.category,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
    readAt: item.readAt?.toISOString() ?? null,
  }));
}

export async function markCustomerNotificationRead(
  userId: string,
  businessId: string,
  inboxItemId: string,
) {
  await prisma.notificationInboxItem.updateMany({
    where: { id: inboxItemId, userId, businessId },
    data: { status: "READ", readAt: new Date() },
  });
}

export async function listCustomerMessages(businessId: string, customerId: string) {
  const conversations = await prisma.communicationConversation.findMany({
    where: { businessId, customerId },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, senderType: true },
      },
    },
  });

  return conversations.map((conversation) => ({
    id: conversation.id,
    subject: conversation.subject,
    status: conversation.status,
    sourceChannel: conversation.sourceChannel,
    lastMessageAt: conversation.lastMessageAt.toISOString(),
    preview: conversation.messages[0]?.body ?? null,
  }));
}

export async function getCustomerConversationDetail(
  businessId: string,
  customerId: string,
  conversationId: string,
) {
  const conversation = await prisma.communicationConversation.findFirst({
    where: { id: conversationId, businessId, customerId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) {
    throw new CustomerPortalError("Conversation not found.");
  }

  return {
    id: conversation.id,
    subject: conversation.subject,
    status: conversation.status,
    messages: conversation.messages.map((message) => ({
      id: message.id,
      content: message.body,
      senderType: message.senderType,
      createdAt: message.createdAt.toISOString(),
    })),
  };
}

export async function sendCustomerMessage(
  businessId: string,
  customerId: string,
  input: { conversationId?: string; subject?: string; content: string },
) {
  let conversationId = input.conversationId;

  if (!conversationId) {
    const created = await prisma.communicationConversation.create({
      data: {
        businessId,
        customerId,
        subject: input.subject?.trim() || "Customer message",
        sourceChannel: "LIVE_CHAT",
        inboxType: "TEAM",
        status: "OPEN",
      },
    });
    conversationId = created.id;
  } else {
    const existing = await prisma.communicationConversation.findFirst({
      where: { id: conversationId, businessId, customerId },
    });
    if (!existing) {
      throw new CustomerPortalError("Conversation not found.");
    }
  }

  await prisma.communicationMessage.create({
    data: {
      conversationId,
      businessId,
      messageType: "INBOUND",
      senderType: "CUSTOMER",
      senderCustomerId: customerId,
      channel: "LIVE_CHAT",
      body: input.content.trim(),
    },
  });

  await prisma.communicationConversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date(), status: "OPEN" },
  });

  return conversationId;
}

export async function listCustomerSupportTickets(businessId: string, customerId: string) {
  const tickets = await prisma.communicationConversation.findMany({
    where: {
      businessId,
      customerId,
      inboxType: "TEAM",
      status: { in: ["OPEN", "WAITING_CUSTOMER", "WAITING_STAFF", "AI_HANDLED", "CLOSED"] },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return tickets.map((ticket) => ({
    id: ticket.id,
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  }));
}

export async function createCustomerSupportTicket(
  businessId: string,
  customerId: string,
  input: { subject: string; content: string },
) {
  return sendCustomerMessage(businessId, customerId, {
    subject: input.subject,
    content: input.content,
  });
}

export async function listCustomerReceipts(businessId: string, customerId: string) {
  const receipts = await prisma.orderReceipt.findMany({
    where: {
      businessId,
      payment: { order: { customerId } },
    },
    include: {
      payment: {
        select: {
          paymentNumber: true,
          amountPaid: true,
          paidAt: true,
          order: { select: { orderNumber: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { currency: true },
  });
  const currency = business?.currency ?? "GBP";

  return receipts.map((receipt) => ({
    id: receipt.id,
    receiptNumber: receipt.receiptNumber,
    orderNumber: receipt.payment.order.orderNumber,
    paymentNumber: receipt.payment.paymentNumber,
    amountFormatted: formatMoney(decimal(receipt.payment.amountPaid), currency),
    paidAt: receipt.payment.paidAt?.toISOString() ?? receipt.createdAt.toISOString(),
    receiptUrl: receipt.receiptUrl,
  }));
}

export async function getCustomerReceiptForDownload(
  businessId: string,
  customerId: string,
  receiptId: string,
) {
  const receipt = await prisma.orderReceipt.findFirst({
    where: {
      id: receiptId,
      businessId,
      payment: { order: { customerId } },
    },
    include: {
      payment: {
        include: {
          order: {
            include: {
              items: true,
            },
          },
        },
      },
    },
  });

  if (!receipt) {
    throw new CustomerPortalError("Receipt not found.");
  }

  return receipt;
}

export async function listCustomerInvoices(businessId: string, customerId: string) {
  const invoices = await prisma.revenueInvoice.findMany({
    where: { businessId, customerId, status: { not: "DRAFT" } },
    orderBy: { issuedAt: "desc" },
    take: 100,
  });

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { currency: true },
  });
  const currency = invoices[0]?.currency ?? business?.currency ?? "GBP";

  return invoices.map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    currency: invoice.currency,
    totalFormatted: formatMoney(invoice.totalPence / 100, invoice.currency || currency),
    amountPaidFormatted: formatMoney(invoice.amountPaidPence / 100, invoice.currency || currency),
    issuedAt: invoice.issuedAt?.toISOString() ?? null,
    dueAt: invoice.dueAt?.toISOString() ?? null,
  }));
}

export async function getCustomerInvoiceDetail(
  businessId: string,
  customerId: string,
  invoiceId: string,
) {
  const invoice = await prisma.revenueInvoice.findFirst({
    where: { id: invoiceId, businessId, customerId },
    include: { lineItems: { orderBy: { sortOrder: "asc" } } },
  });

  if (!invoice) {
    throw new CustomerPortalError("Invoice not found.");
  }

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    currency: invoice.currency,
    subtotalFormatted: formatMoney(invoice.subtotalPence / 100, invoice.currency),
    taxFormatted: formatMoney(invoice.taxPence / 100, invoice.currency),
    totalFormatted: formatMoney(invoice.totalPence / 100, invoice.currency),
    amountPaidFormatted: formatMoney(invoice.amountPaidPence / 100, invoice.currency),
    issuedAt: invoice.issuedAt?.toISOString() ?? null,
    dueAt: invoice.dueAt?.toISOString() ?? null,
    notes: invoice.notes,
    lineItems: invoice.lineItems.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPriceFormatted: formatMoney(item.unitPricePence / 100, invoice.currency),
      totalFormatted: formatMoney(item.totalPence / 100, invoice.currency),
    })),
  };
}

export async function listCustomerFavorites(businessId: string, customerId: string) {
  const orderItems = await prisma.restaurantOrderItem.findMany({
    where: { order: { businessId, customerId } },
    select: {
      productId: true,
      productNameSnapshot: true,
      quantity: true,
      product: { select: { id: true, price: true, image: true } },
    },
  });

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { currency: true },
  });
  const currency = business?.currency ?? "GBP";

  const favorites = new Map<
    string,
    {
      productId: string;
      name: string;
      orderCount: number;
      totalQuantity: number;
      priceFormatted: string;
      imageUrl: string | null;
    }
  >();

  for (const item of orderItems) {
    const existing = favorites.get(item.productId);
    const price = decimal(item.product.price);
    if (!existing) {
      favorites.set(item.productId, {
        productId: item.productId,
        name: item.productNameSnapshot,
        orderCount: 1,
        totalQuantity: item.quantity,
        priceFormatted: formatMoney(price, currency),
        imageUrl: item.product.image,
      });
    } else {
      existing.orderCount += 1;
      existing.totalQuantity += item.quantity;
    }
  }

  return Array.from(favorites.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
}

export async function updateCustomerPortalProfile(
  businessId: string,
  customerId: string,
  input: {
    name?: string;
    phone?: string | null;
    marketingConsent?: boolean;
    preferredLanguage?: string | null;
  },
) {
  return prisma.customer.update({
    where: { id: customerId, businessId },
    data: {
      ...(input.name ? { name: input.name.trim(), fullName: input.name.trim() } : {}),
      ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
      ...(input.marketingConsent !== undefined ? { marketingConsent: input.marketingConsent } : {}),
      ...(input.preferredLanguage !== undefined
        ? { preferredLanguage: input.preferredLanguage?.trim() || null }
        : {}),
    },
  });
}

export async function getCustomerPreferences(
  businessId: string,
  customerId: string,
  userId: string,
) {
  const [customer, notificationPrefs] = await Promise.all([
    prisma.customer.findFirst({
      where: { id: customerId, businessId },
      select: {
        marketingConsent: true,
        preferredLanguage: true,
      },
    }),
    prisma.notificationUserPreference.findFirst({
      where: { businessId, userId },
    }),
  ]);

  const enabledChannels = notificationPrefs?.enabledChannels ?? ["IN_APP", "EMAIL"];

  return {
    marketingConsent: customer?.marketingConsent ?? false,
    preferredLanguage: customer?.preferredLanguage ?? "en",
    emailEnabled: enabledChannels.includes("EMAIL"),
    pushEnabled: enabledChannels.includes("IN_APP"),
    smsEnabled: enabledChannels.includes("SMS"),
    digestFrequency: notificationPrefs?.digestFrequency ?? "DAILY",
  };
}

export async function updateCustomerPreferences(
  businessId: string,
  customerId: string,
  userId: string,
  input: {
    marketingConsent?: boolean;
    preferredLanguage?: string | null;
    emailEnabled?: boolean;
    pushEnabled?: boolean;
    smsEnabled?: boolean;
    digestFrequency?: NotificationDigestFrequency;
  },
) {
  if (input.marketingConsent !== undefined || input.preferredLanguage !== undefined) {
    await updateCustomerPortalProfile(businessId, customerId, {
      marketingConsent: input.marketingConsent,
      preferredLanguage: input.preferredLanguage,
    });
  }

  const existing = await prisma.notificationUserPreference.findFirst({
    where: { businessId, userId },
  });

  const currentChannels =
    existing?.enabledChannels ?? (["IN_APP", "EMAIL"] as NotificationChannel[]);
  let enabledChannels = [...currentChannels];

  if (input.emailEnabled !== undefined) {
    enabledChannels = input.emailEnabled
      ? Array.from(new Set([...enabledChannels, "EMAIL"]))
      : enabledChannels.filter((channel) => channel !== "EMAIL");
  }

  if (input.pushEnabled !== undefined) {
    enabledChannels = input.pushEnabled
      ? Array.from(new Set([...enabledChannels, "IN_APP"]))
      : enabledChannels.filter((channel) => channel !== "IN_APP");
  }

  if (input.smsEnabled !== undefined) {
    enabledChannels = input.smsEnabled
      ? Array.from(new Set([...enabledChannels, "SMS"]))
      : enabledChannels.filter((channel) => channel !== "SMS");
  }

  const data = {
    enabledChannels,
    ...(input.digestFrequency !== undefined ? { digestFrequency: input.digestFrequency } : {}),
  };

  if (existing) {
    await prisma.notificationUserPreference.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.notificationUserPreference.create({
      data: {
        businessId,
        userId,
        enabledChannels: data.enabledChannels,
        digestFrequency: input.digestFrequency ?? "DAILY",
      },
    });
  }
}

export async function listCustomerAssistantConversations(businessId: string, customerId: string) {
  const conversations = await prisma.communicationConversation.findMany({
    where: {
      businessId,
      customerId,
      sourceChannel: "LIVE_CHAT",
      status: { in: ["OPEN", "AI_HANDLED", "WAITING_CUSTOMER"] },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return conversations.map((conversation) => ({
    id: conversation.id,
    subject: conversation.subject,
    updatedAt: conversation.updatedAt.toISOString(),
    preview: conversation.messages[0]?.body ?? null,
  }));
}

async function composeCustomerAssistantReply(
  businessId: string,
  customerId: string,
  message: string,
): Promise<string> {
  const normalized = message.trim().toLowerCase();
  const [customer, recentOrders, upcomingReservations] = await Promise.all([
    prisma.customer.findFirst({
      where: { id: customerId, businessId },
      select: { name: true, loyaltyPoints: true, totalOrders: true },
    }),
    prisma.restaurantOrder.findMany({
      where: { businessId, customerId },
      orderBy: { placedAt: "desc" },
      take: 3,
      select: { orderNumber: true, status: true, totalAmount: true, placedAt: true },
    }),
    prisma.reservation.findMany({
      where: {
        businessId,
        customerId,
        reservationDate: { gte: new Date() },
      },
      orderBy: { reservationDate: "asc" },
      take: 3,
      select: { reservationNumber: true, reservationDate: true, partySize: true, status: true },
    }),
  ]);

  const greeting = customer?.name ? `Hi ${customer.name},` : "Hi there,";

  if (/loyalty|points|reward/.test(normalized)) {
    return `${greeting} you currently have ${customer?.loyaltyPoints ?? 0} loyalty points across ${customer?.totalOrders ?? 0} orders. Visit Rewards in your portal to redeem available offers.`;
  }

  if (/order|track|status/.test(normalized)) {
    if (recentOrders.length === 0) {
      return `${greeting} I couldn't find recent orders on your account yet.`;
    }
    const lines = recentOrders.map(
      (order) =>
        `- #${order.orderNumber} (${order.status}) on ${order.placedAt.toLocaleDateString()}`,
    );
    return `${greeting} here are your latest orders:\n${lines.join("\n")}`;
  }

  if (/reserv|book|table/.test(normalized)) {
    if (upcomingReservations.length === 0) {
      return `${greeting} you don't have any upcoming reservations. You can book from the restaurant directly or contact support.`;
    }
    const lines = upcomingReservations.map(
      (reservation) =>
        `- #${reservation.reservationNumber} for ${reservation.partySize} on ${reservation.reservationDate.toLocaleDateString()} (${reservation.status})`,
    );
    return `${greeting} your upcoming reservations:\n${lines.join("\n")}`;
  }

  return `${greeting} I can help with your orders, loyalty points, reservations, receipts, and account details. What would you like to check?`;
}

export async function sendCustomerAssistantMessage(
  businessId: string,
  customerId: string,
  content: string,
  options: {
    conversationId?: string;
    sessionToken?: string;
    confirmedActions?: string[];
  } = {},
) {
  const { runCustomerAiChat } = await import(
    "@/modules/customer-ai/services/customer-ai-chat.service"
  );

  const aiResult = await runCustomerAiChat({
    businessId,
    message: content.trim(),
    conversationId: options.conversationId,
    sessionToken: options.sessionToken,
    customerId,
    channel: "portal",
    confirmedActions: options.confirmedActions,
  });

  let commConversationId = options.conversationId;
  if (!commConversationId) {
    const created = await prisma.communicationConversation.create({
      data: {
        businessId,
        customerId,
        subject: "AI Assistant",
        sourceChannel: "LIVE_CHAT",
        inboxType: "TEAM",
        status: "AI_HANDLED",
        tags: ["customer-ai", `ai-conv:${aiResult.conversationId}`],
      },
    });
    commConversationId = created.id;
  }

  await prisma.communicationMessage.create({
    data: {
      conversationId: commConversationId,
      businessId,
      messageType: "INBOUND",
      senderType: "CUSTOMER",
      senderCustomerId: customerId,
      channel: "LIVE_CHAT",
      body: content.trim(),
    },
  });

  await prisma.communicationMessage.create({
    data: {
      conversationId: commConversationId,
      businessId,
      messageType: "OUTBOUND",
      senderType: "AI_AGENT",
      channel: "LIVE_CHAT",
      body: aiResult.content,
    },
  });

  await prisma.communicationConversation.update({
    where: { id: commConversationId },
    data: { lastMessageAt: new Date() },
  });

  return {
    conversationId: aiResult.conversationId,
    sessionToken: aiResult.sessionToken,
    reply: aiResult.content,
    aiName: aiResult.aiName,
    aiAvatarUrl: aiResult.aiAvatarUrl,
    requiresConfirmation: aiResult.requiresConfirmation,
    requiresVerification: aiResult.toolResults.some(
      (entry) => entry.output.requiresVerification === true,
    ),
  };
}

export { formatMoney as formatCustomerPortalMoney };
