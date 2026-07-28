"use server";

import { revalidatePath } from "next/cache";

import { BUSINESS_ROUTES } from "@/modules/business/constants/routes";
import { requireAuthenticatedUser } from "@/modules/onboarding/lib/onboarding-guard";
import {
  createBranch,
  createBusinessContact,
  deleteBranch,
  deleteBusinessContact,
  saveBusinessHours,
  updateBranch,
  updateBusinessContact,
  updateGeneralBusinessInfo,
  type BranchInput,
  type BusinessContactInput,
  type BusinessHoursInput,
  type GeneralBusinessInput,
} from "@/services/business-management.service";

function revalidateBusinessPages() {
  Object.values(BUSINESS_ROUTES).forEach((path) => revalidatePath(path));
}

export async function saveGeneralBusinessAction(input: GeneralBusinessInput) {
  const user = await requireAuthenticatedUser();
  await updateGeneralBusinessInfo(user.id, input);
  revalidateBusinessPages();
  return { success: true as const };
}

export async function createBranchAction(input: BranchInput) {
  const user = await requireAuthenticatedUser();
  await createBranch(user.id, input);
  revalidateBusinessPages();
  return { success: true as const };
}

export async function updateBranchAction(branchId: string, input: BranchInput) {
  const user = await requireAuthenticatedUser();
  await updateBranch(user.id, branchId, input);
  revalidateBusinessPages();
  return { success: true as const };
}

export async function deleteBranchAction(branchId: string) {
  const user = await requireAuthenticatedUser();
  await deleteBranch(user.id, branchId);
  revalidateBusinessPages();
  return { success: true as const };
}

export async function saveBusinessHoursAction(hours: BusinessHoursInput[]) {
  const user = await requireAuthenticatedUser();
  await saveBusinessHours(user.id, hours);
  revalidateBusinessPages();
  return { success: true as const };
}

export async function createContactAction(input: BusinessContactInput) {
  const user = await requireAuthenticatedUser();
  await createBusinessContact(user.id, input);
  revalidateBusinessPages();
  return { success: true as const };
}

export async function updateContactAction(contactId: string, input: BusinessContactInput) {
  const user = await requireAuthenticatedUser();
  await updateBusinessContact(user.id, contactId, input);
  revalidateBusinessPages();
  return { success: true as const };
}

export async function deleteContactAction(contactId: string) {
  const user = await requireAuthenticatedUser();
  await deleteBusinessContact(user.id, contactId);
  revalidateBusinessPages();
  return { success: true as const };
}
