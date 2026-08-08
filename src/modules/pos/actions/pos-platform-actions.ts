"use server";

import { revalidatePath } from "next/cache";

import { POS_MODULE_PERMISSIONS } from "@/modules/pos/constants/permissions";
import { POS_ROUTES } from "@/modules/pos/constants/routes";
import { resolvePosScope, toPosPlatformContext } from "@/modules/pos/lib/pos-scope";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { posService } from "@/modules/pos/services/pos.service";
import {
  applyPosDiscountSchema,
  cashDrawerActionSchema,
  closePosShiftSchema,
  createPosSaleSchema,
  mergePosBillsSchema,
  openPosShiftSchema,
  processPosPaymentSchema,
  processPosRefundSchema,
  splitPosBillSchema,
  transferPosTableSchema,
  voidPosOrderSchema,
} from "@/modules/pos/validation/pos-schemas";

function revalidatePosPlatformPages() {
  revalidatePath(POS_ROUTES.overview);
  revalidatePath("/dashboard/restaurant/pos");
  revalidatePath("/app/restaurant/pos");
}

export async function createPosSaleAction(input: unknown) {
  return protectedAction(POS_MODULE_PERMISSIONS.POS_CREATE, async ({ platform }) => {
    const body = createPosSaleSchema.parse(input);
    const context = toPosPlatformContext(resolvePosScope(platform));
    const record = await posService.createSale(context, body);
    revalidatePosPlatformPages();
    return { success: true as const, record };
  });
}

export async function applyPosDiscountAction(input: unknown) {
  return protectedAction(POS_MODULE_PERMISSIONS.POS_UPDATE, async ({ platform }) => {
    const body = applyPosDiscountSchema.parse(input);
    const context = toPosPlatformContext(resolvePosScope(platform));
    const record = await posService.applyDiscount(context, body);
    revalidatePosPlatformPages();
    return { success: true as const, record };
  });
}

export async function splitPosBillAction(input: unknown) {
  return protectedAction(POS_MODULE_PERMISSIONS.POS_UPDATE, async ({ platform }) => {
    const body = splitPosBillSchema.parse(input);
    const context = toPosPlatformContext(resolvePosScope(platform));
    const record = await posService.splitBill(context, body);
    revalidatePosPlatformPages();
    return { success: true as const, record };
  });
}

export async function processPosPaymentAction(input: unknown) {
  return protectedAction(POS_MODULE_PERMISSIONS.POS_UPDATE, async ({ platform }) => {
    const body = processPosPaymentSchema.parse(input);
    const context = toPosPlatformContext(resolvePosScope(platform));
    const record = await posService.processPayment(context, body);
    revalidatePosPlatformPages();
    return { success: true as const, record };
  });
}

export async function processPosRefundAction(input: unknown) {
  return protectedAction(POS_MODULE_PERMISSIONS.POS_REFUND, async ({ platform }) => {
    const body = processPosRefundSchema.parse(input);
    const context = toPosPlatformContext(resolvePosScope(platform));
    const record = await posService.processRefund(context, body);
    revalidatePosPlatformPages();
    return { success: true as const, record };
  });
}

export async function voidPosOrderAction(input: unknown) {
  return protectedAction(POS_MODULE_PERMISSIONS.POS_UPDATE, async ({ platform }) => {
    const body = voidPosOrderSchema.parse(input);
    const context = toPosPlatformContext(resolvePosScope(platform));
    const record = await posService.voidOrder(context, body.orderId, body.reason);
    revalidatePosPlatformPages();
    return { success: true as const, record };
  });
}

export async function mergePosBillsAction(input: unknown) {
  return protectedAction(POS_MODULE_PERMISSIONS.POS_UPDATE, async ({ platform }) => {
    const body = mergePosBillsSchema.parse(input);
    const context = toPosPlatformContext(resolvePosScope(platform));
    const record = await posService.mergeBills(context, body);
    revalidatePosPlatformPages();
    return { success: true as const, record };
  });
}

export async function transferPosTableAction(input: unknown) {
  return protectedAction(POS_MODULE_PERMISSIONS.POS_UPDATE, async ({ platform }) => {
    const body = transferPosTableSchema.parse(input);
    const context = toPosPlatformContext(resolvePosScope(platform));
    const record = await posService.transferTable(context, body);
    revalidatePosPlatformPages();
    return { success: true as const, record };
  });
}

export async function openPosShiftAction(input: unknown) {
  return protectedAction(POS_MODULE_PERMISSIONS.POS_CREATE, async ({ platform }) => {
    const body = openPosShiftSchema.parse(input);
    const context = toPosPlatformContext(resolvePosScope(platform));
    const shift = await posService.openShift(context, body);
    revalidatePosPlatformPages();
    return { success: true as const, shift };
  });
}

export async function closePosShiftAction(input: unknown) {
  return protectedAction(POS_MODULE_PERMISSIONS.POS_CLOSE_SHIFT, async ({ platform }) => {
    const body = closePosShiftSchema.parse(input);
    const context = toPosPlatformContext(resolvePosScope(platform));
    const shift = await posService.closeShift(context, body);
    revalidatePosPlatformPages();
    return { success: true as const, shift };
  });
}

export async function openPosCashDrawerAction(input: unknown) {
  return protectedAction(POS_MODULE_PERMISSIONS.POS_UPDATE, async ({ platform }) => {
    const body = cashDrawerActionSchema.parse(input);
    const context = toPosPlatformContext(resolvePosScope(platform));
    const drawer = await posService.openCashDrawer(context, body);
    revalidatePosPlatformPages();
    return { success: true as const, drawer };
  });
}

export async function closePosCashDrawerAction(input: unknown) {
  return protectedAction(POS_MODULE_PERMISSIONS.POS_CLOSE_SHIFT, async ({ platform }) => {
    const body = cashDrawerActionSchema.parse(input);
    const context = toPosPlatformContext(resolvePosScope(platform));
    const drawer = await posService.closeCashDrawer(context, body);
    revalidatePosPlatformPages();
    return { success: true as const, drawer };
  });
}

export async function reprintPosReceiptAction(orderId: string) {
  return protectedAction(POS_MODULE_PERMISSIONS.POS_READ, async ({ platform }) => {
    const context = toPosPlatformContext(resolvePosScope(platform));
    const record = await posService.reprintReceipt(context, orderId);
    revalidatePosPlatformPages();
    return { success: true as const, record };
  });
}

export async function fetchPosPlatformSnapshotAction() {
  return protectedAction(POS_MODULE_PERMISSIONS.POS_READ, async ({ platform }) => {
    const context = toPosPlatformContext(resolvePosScope(platform));
    const [records, registers, terminals, shifts, employees, cashDrawers, activeSession] =
      await Promise.all([
        posService.list(context),
        posService.listRegisters(context),
        posService.listTerminals(context),
        posService.listShifts(context),
        posService.listEmployees(context),
        posService.listCashDrawers(context),
        posService.getActiveSession(context),
      ]);

    return {
      context,
      records,
      registers,
      terminals,
      shifts,
      employees,
      cashDrawers,
      activeSession,
    };
  });
}
