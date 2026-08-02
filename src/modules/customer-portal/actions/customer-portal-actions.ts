"use server";

import { revalidatePath } from "next/cache";
import type { NotificationDigestFrequency } from "@prisma/client";

import { CUSTOMER_PORTAL_ROUTES } from "@/modules/customer-portal/constants/routes";
import { requireCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import { setCustomerPortalBusinessCookie } from "@/modules/customer-portal/services/customer-portal-session.service";
import {
  createCustomerSupportTicket,
  deleteCustomerPortalAddress,
  markCustomerNotificationRead,
  redeemCustomerReward,
  sendCustomerAssistantMessage,
  sendCustomerMessage,
  updateCustomerPortalProfile,
  updateCustomerPreferences,
  upsertCustomerPortalAddress,
} from "@/services/customer-portal.service";
import { updatePassword } from "@/services/auth.service";

function revalidatePortal() {
  revalidatePath(CUSTOMER_PORTAL_ROUTES.dashboard, "layout");
}

export async function switchCustomerBusinessAction(businessId: string) {
  const context = await requireCustomerPortalContext();
  const membership = context.memberships.find((entry) => entry.businessId === businessId);
  if (!membership) {
    throw new Error("Business membership not found.");
  }
  await setCustomerPortalBusinessCookie(businessId);
  revalidatePortal();
  return { success: true as const };
}

export async function updateCustomerProfileAction(input: {
  name?: string;
  phone?: string | null;
  marketingConsent?: boolean;
  preferredLanguage?: string | null;
}) {
  const context = await requireCustomerPortalContext();
  await updateCustomerPortalProfile(context.business.id, context.customer.id, input);
  revalidatePortal();
  return { success: true as const };
}

export async function saveCustomerAddressAction(input: {
  addressId?: string;
  label?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city?: string | null;
  postcode?: string | null;
  country?: string | null;
  isDefault?: boolean;
}) {
  const context = await requireCustomerPortalContext();
  await upsertCustomerPortalAddress(context.customer.id, input, input.addressId);
  revalidatePortal();
  return { success: true as const };
}

export async function deleteCustomerAddressAction(addressId: string) {
  const context = await requireCustomerPortalContext();
  await deleteCustomerPortalAddress(context.customer.id, addressId);
  revalidatePortal();
  return { success: true as const };
}

export async function redeemCustomerRewardAction(rewardId: string) {
  const context = await requireCustomerPortalContext();
  await redeemCustomerReward(context.business.id, context.customer.id, rewardId);
  revalidatePortal();
  return { success: true as const };
}

export async function markCustomerNotificationReadAction(inboxItemId: string) {
  const context = await requireCustomerPortalContext();
  await markCustomerNotificationRead(context.userId, context.business.id, inboxItemId);
  revalidatePortal();
  return { success: true as const };
}

export async function sendCustomerMessageAction(input: {
  conversationId?: string;
  subject?: string;
  content: string;
}) {
  const context = await requireCustomerPortalContext();
  const conversationId = await sendCustomerMessage(context.business.id, context.customer.id, input);
  revalidatePortal();
  return { success: true as const, conversationId };
}

export async function createCustomerSupportTicketAction(input: {
  subject: string;
  content: string;
}) {
  const context = await requireCustomerPortalContext();
  const ticketId = await createCustomerSupportTicket(
    context.business.id,
    context.customer.id,
    input,
  );
  revalidatePortal();
  return { success: true as const, ticketId };
}

export async function sendCustomerAssistantMessageAction(input: {
  content: string;
  conversationId?: string;
}) {
  const context = await requireCustomerPortalContext();
  const result = await sendCustomerAssistantMessage(
    context.business.id,
    context.customer.id,
    input.content,
    input.conversationId,
  );
  revalidatePortal();
  return { success: true as const, ...result };
}

export async function updateCustomerPreferencesAction(input: {
  marketingConsent?: boolean;
  preferredLanguage?: string | null;
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  smsEnabled?: boolean;
  digestFrequency?: NotificationDigestFrequency;
}) {
  const context = await requireCustomerPortalContext();
  await updateCustomerPreferences(context.business.id, context.customer.id, context.userId, input);
  revalidatePortal();
  return { success: true as const };
}

export async function updateCustomerPasswordAction(password: string) {
  await requireCustomerPortalContext();
  await updatePassword(password);
  return { success: true as const };
}
