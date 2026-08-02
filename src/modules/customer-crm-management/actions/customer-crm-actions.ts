"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { CUSTOMER_CRM_ROUTES } from "@/modules/customer-crm-management/constants/routes";
import { requireCustomerCrmActionContext } from "@/modules/customer-crm-management/lib/get-customer-crm-context";
import type {
  CustomerAddressInput,
  CustomerImportRow,
  CustomerMergeInput,
  CustomerRegistrationInput,
  LoyaltyPointsInput,
} from "@/modules/customer-crm-management/types/customer-crm-types";
import {
  archiveManagedCustomer,
  findDuplicateCustomers,
  importManagedCustomers,
  mergeManagedCustomers,
  registerManagedCustomer,
  updateManagedCustomer,
  upsertCustomerAddress,
} from "@/services/restaurant-customer.service";
import {
  adjustLoyaltyPoints,
  redeemLoyaltyPoints,
} from "@/services/restaurant-loyalty-account.service";

function revalidateCustomerPages(customerId?: string) {
  revalidatePath(CUSTOMER_CRM_ROUTES.dashboard());
  if (customerId) {
    revalidatePath(CUSTOMER_CRM_ROUTES.profile(customerId));
    revalidatePath(CUSTOMER_CRM_ROUTES.loyalty(customerId));
  }
}

export async function registerCustomerAction(input: CustomerRegistrationInput) {
  const context = await requireCustomerCrmActionContext(PERMISSION_CODES.CUSTOMER_CREATE);
  const customer = await registerManagedCustomer(context.user.id, input);
  revalidateCustomerPages(customer.id);
  return customer;
}

export async function updateCustomerAction(customerId: string, input: CustomerRegistrationInput) {
  const context = await requireCustomerCrmActionContext(PERMISSION_CODES.CUSTOMER_UPDATE);
  const customer = await updateManagedCustomer(context.user.id, customerId, input);
  revalidateCustomerPages(customerId);
  return customer;
}

export async function archiveCustomerAction(customerId: string) {
  const context = await requireCustomerCrmActionContext(PERMISSION_CODES.CUSTOMER_DELETE);
  await archiveManagedCustomer(context.user.id, customerId);
  revalidateCustomerPages(customerId);
  return { success: true };
}

export async function findDuplicateCustomersAction(input: CustomerRegistrationInput) {
  const context = await requireCustomerCrmActionContext(PERMISSION_CODES.CUSTOMER_CREATE);
  return findDuplicateCustomers(context.user.id, input);
}

export async function mergeCustomersAction(input: CustomerMergeInput) {
  const context = await requireCustomerCrmActionContext(PERMISSION_CODES.CUSTOMER_UPDATE);
  const customer = await mergeManagedCustomers(context.user.id, input);
  revalidateCustomerPages(customer.id);
  return customer;
}

export async function upsertCustomerAddressAction(
  customerId: string,
  input: CustomerAddressInput,
  addressId?: string,
) {
  const context = await requireCustomerCrmActionContext(PERMISSION_CODES.CUSTOMER_UPDATE);
  const address = await upsertCustomerAddress(context.user.id, customerId, input, addressId);
  revalidateCustomerPages(customerId);
  return address;
}

export async function importCustomersAction(rows: CustomerImportRow[]) {
  const context = await requireCustomerCrmActionContext(PERMISSION_CODES.CUSTOMER_IMPORT);
  const result = await importManagedCustomers(context.user.id, rows);
  revalidatePath(CUSTOMER_CRM_ROUTES.dashboard());
  return result;
}

export async function redeemLoyaltyPointsAction(input: LoyaltyPointsInput) {
  await requireCustomerCrmActionContext(PERMISSION_CODES.LOYALTY_MANAGE);
  const transaction = await redeemLoyaltyPoints(
    "",
    input.customerId,
    input.points,
    input.notes ?? undefined,
  );
  revalidateCustomerPages(input.customerId);
  return transaction;
}

export async function adjustLoyaltyPointsAction(input: LoyaltyPointsInput) {
  await requireCustomerCrmActionContext(PERMISSION_CODES.LOYALTY_MANAGE);
  const transaction = await adjustLoyaltyPoints(
    "",
    input.customerId,
    input.points,
    input.notes ?? undefined,
  );
  revalidateCustomerPages(input.customerId);
  return transaction;
}
