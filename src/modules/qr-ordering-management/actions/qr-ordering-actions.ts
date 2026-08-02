"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { QR_ORDERING_ROUTES } from "@/modules/qr-ordering-management/constants/routes";
import { requireQrActionContext } from "@/modules/qr-ordering-management/lib/get-qr-ordering-context";
import {
  generateTableQrCode,
  listTableQrCodes,
  regenerateTableQrCode,
  updateTableQrCodeStatus,
} from "@/services/restaurant-qr-ordering.service";
import { prisma } from "@/lib/prisma";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

function revalidateQrPages(branchId: string) {
  revalidatePath(QR_ORDERING_ROUTES.dashboardForBranch(branchId));
  revalidatePath(QR_ORDERING_ROUTES.printSheet(branchId));
}

export async function generateTableQrCodeAction(branchId: string, tableId: string) {
  const context = await requireQrActionContext(branchId, PERMISSION_CODES.QR_GENERATE);
  const record = await generateTableQrCode(context.user.id, branchId, tableId);
  revalidateQrPages(branchId);
  return record;
}

export async function regenerateTableQrCodeAction(branchId: string, qrCodeId: string) {
  const context = await requireQrActionContext(branchId, PERMISSION_CODES.QR_GENERATE);
  const record = await regenerateTableQrCode(context.user.id, qrCodeId);
  revalidateQrPages(branchId);
  return record;
}

export async function updateTableQrCodeStatusAction(
  branchId: string,
  qrCodeId: string,
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED",
) {
  const context = await requireQrActionContext(branchId, PERMISSION_CODES.QR_UPDATE);
  const record = await updateTableQrCodeStatus(context.user.id, qrCodeId, status);
  revalidateQrPages(branchId);
  return record;
}

export async function deleteTableQrCodeAction(branchId: string, qrCodeId: string) {
  const context = await requireQrActionContext(branchId, PERMISSION_CODES.QR_DELETE);
  const business = await getOrCreateBusinessForOwner(context.user.id);

  await prisma.tableQRCode.deleteMany({
    where: { id: qrCodeId, businessId: business.id, branchId },
  });

  revalidateQrPages(branchId);
  return { success: true as const };
}

export async function bulkGenerateTableQrCodesAction(branchId: string, tableIds: string[]) {
  const context = await requireQrActionContext(branchId, PERMISSION_CODES.QR_GENERATE);

  for (const tableId of tableIds) {
    await generateTableQrCode(context.user.id, branchId, tableId);
  }

  revalidateQrPages(branchId);
  return listTableQrCodes(context.user.id, branchId);
}
