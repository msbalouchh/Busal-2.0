"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { ORDER_MANAGEMENT_ROUTES } from "@/modules/order-management/constants/routes";
import { requireOrderActionContext } from "@/modules/order-management/lib/get-order-management-context";
import { validateOrderInput } from "@/modules/order-management/lib/order-validation";
import type {
  MergeOrdersInput,
  OrderAdjustmentsInput,
  OrderManagementInput,
  SplitOrderInput,
  TransferOrderTableInput,
} from "@/modules/order-management/types/order-management-types";
import {
  applyOrderAdjustments,
  cancelManagedOrder,
  completeManagedOrder,
  confirmManagedOrder,
  createManagedOrder,
  deleteManagedOrder,
  markReadyManagedOrder,
  markServedManagedOrder,
  mergeManagedOrders,
  splitManagedOrder,
  startPreparingManagedOrder,
  transferOrderTable,
  updateManagedOrder,
} from "@/services/restaurant-order.service";

function revalidateOrderPages(branchId: string, orderId?: string) {
  revalidatePath(ORDER_MANAGEMENT_ROUTES.listForBranch(branchId));

  if (orderId) {
    revalidatePath(ORDER_MANAGEMENT_ROUTES.details(orderId, branchId));
    revalidatePath(ORDER_MANAGEMENT_ROUTES.edit(orderId, branchId));
  }
}

export async function createOrderManagementAction(branchId: string, input: OrderManagementInput) {
  const context = await requireOrderActionContext(branchId, PERMISSION_CODES.ORDER_CREATE);
  validateOrderInput(input);
  const order = await createManagedOrder(context.user.id, { ...input, branchId });
  revalidateOrderPages(branchId, order.id);
  return { success: true as const, orderId: order.id };
}

export async function updateOrderManagementAction(
  branchId: string,
  orderId: string,
  input: OrderManagementInput,
) {
  const context = await requireOrderActionContext(branchId, PERMISSION_CODES.ORDER_UPDATE);
  validateOrderInput(input);
  await updateManagedOrder(context.user.id, orderId, { ...input, branchId });
  revalidateOrderPages(branchId, orderId);
  return { success: true as const };
}

export async function confirmOrderManagementAction(branchId: string, orderId: string) {
  const context = await requireOrderActionContext(branchId, PERMISSION_CODES.ORDER_UPDATE);
  await confirmManagedOrder(context.user.id, branchId, orderId);
  revalidateOrderPages(branchId, orderId);
  return { success: true as const };
}

export async function startPreparingOrderManagementAction(branchId: string, orderId: string) {
  const context = await requireOrderActionContext(branchId, PERMISSION_CODES.ORDER_UPDATE);
  await startPreparingManagedOrder(context.user.id, branchId, orderId);
  revalidateOrderPages(branchId, orderId);
  return { success: true as const };
}

export async function markReadyOrderManagementAction(branchId: string, orderId: string) {
  const context = await requireOrderActionContext(branchId, PERMISSION_CODES.ORDER_UPDATE);
  await markReadyManagedOrder(context.user.id, branchId, orderId);
  revalidateOrderPages(branchId, orderId);
  return { success: true as const };
}

export async function markServedOrderManagementAction(branchId: string, orderId: string) {
  const context = await requireOrderActionContext(branchId, PERMISSION_CODES.ORDER_UPDATE);
  await markServedManagedOrder(context.user.id, branchId, orderId);
  revalidateOrderPages(branchId, orderId);
  return { success: true as const };
}

export async function completeOrderManagementAction(branchId: string, orderId: string) {
  const context = await requireOrderActionContext(branchId, PERMISSION_CODES.ORDER_UPDATE);
  await completeManagedOrder(context.user.id, branchId, orderId);
  revalidateOrderPages(branchId, orderId);
  return { success: true as const };
}

export async function cancelOrderManagementAction(branchId: string, orderId: string) {
  const context = await requireOrderActionContext(branchId, PERMISSION_CODES.ORDER_CANCEL);
  await cancelManagedOrder(context.user.id, branchId, orderId);
  revalidateOrderPages(branchId, orderId);
  return { success: true as const };
}

export async function deleteOrderManagementAction(branchId: string, orderId: string) {
  const context = await requireOrderActionContext(branchId, PERMISSION_CODES.ORDER_DELETE);
  await deleteManagedOrder(context.user.id, branchId, orderId);
  revalidateOrderPages(branchId);
  return { success: true as const };
}

export async function applyOrderAdjustmentsAction(input: OrderAdjustmentsInput) {
  const context = await requireOrderActionContext(input.branchId, PERMISSION_CODES.ORDER_DISCOUNT);
  await applyOrderAdjustments(context.user.id, input);
  revalidateOrderPages(input.branchId, input.orderId);
  return { success: true as const };
}

export async function transferOrderTableAction(input: TransferOrderTableInput) {
  const context = await requireOrderActionContext(input.branchId, PERMISSION_CODES.ORDER_TRANSFER);
  await transferOrderTable(context.user.id, input);
  revalidateOrderPages(input.branchId, input.orderId);
  return { success: true as const };
}

export async function splitOrderManagementAction(input: SplitOrderInput) {
  const context = await requireOrderActionContext(input.branchId, PERMISSION_CODES.ORDER_UPDATE);
  const order = await splitManagedOrder(context.user.id, input);
  revalidateOrderPages(input.branchId, input.orderId);
  revalidateOrderPages(input.branchId, order.id);
  return { success: true as const, orderId: order.id };
}

export async function mergeOrdersManagementAction(input: MergeOrdersInput) {
  const context = await requireOrderActionContext(input.branchId, PERMISSION_CODES.ORDER_UPDATE);
  await mergeManagedOrders(context.user.id, input);
  revalidateOrderPages(input.branchId, input.targetOrderId);
  return { success: true as const };
}
