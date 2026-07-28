"use server";

import { revalidatePath } from "next/cache";

import { QR_MENU_ROUTES } from "@/modules/qr-menu/constants/routes";
import { requireAuthenticatedUser } from "@/modules/onboarding/lib/onboarding-guard";
import {
  activateQRCode,
  createQRCode,
  deactivateQRCode,
  deleteQRCode,
  updateQRCode,
  type CreateQRCodeInput,
  type UpdateQRCodeInput,
} from "@/services/qr-menu.service";

function revalidateQRMenuPages() {
  revalidatePath(QR_MENU_ROUTES.overview);
}

export async function createQRCodeAction(input: CreateQRCodeInput) {
  const user = await requireAuthenticatedUser();
  await createQRCode(user.id, input);
  revalidateQRMenuPages();
  return { success: true as const };
}

export async function updateQRCodeAction(qrCodeId: string, input: UpdateQRCodeInput) {
  const user = await requireAuthenticatedUser();
  await updateQRCode(user.id, qrCodeId, input);
  revalidateQRMenuPages();
  return { success: true as const };
}

export async function deleteQRCodeAction(qrCodeId: string) {
  const user = await requireAuthenticatedUser();
  await deleteQRCode(user.id, qrCodeId);
  revalidateQRMenuPages();
  return { success: true as const };
}

export async function activateQRCodeAction(qrCodeId: string) {
  const user = await requireAuthenticatedUser();
  await activateQRCode(user.id, qrCodeId);
  revalidateQRMenuPages();
  return { success: true as const };
}

export async function deactivateQRCodeAction(qrCodeId: string) {
  const user = await requireAuthenticatedUser();
  await deactivateQRCode(user.id, qrCodeId);
  revalidateQRMenuPages();
  return { success: true as const };
}
