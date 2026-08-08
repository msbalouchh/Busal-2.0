import "server-only";

import { POS_ORDER_STATUSES } from "@/modules/pos/constants/pos-status";
import { posService } from "@/modules/pos/services/pos.service";
import {
  buildPosPlatformSnapshot,
  getOpenPosOrders,
} from "@/modules/pos/services/pos-platform.service";
import { getPosOrderSummary } from "@/modules/pos/utils/pos-selectors";
import type { PosAiContext, PosPlatformContext, PosRecord } from "@/modules/pos/types/pos-platform";
import {
  resolveBusinessContextFromModule,
  runModuleAiJsonTask,
  type ModulePlatformContext,
} from "@/services/ai-engine-bridge.service";

const MODULE_NAME = "pos";

function toModulePlatform(context: PosPlatformContext): ModulePlatformContext {
  return {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  };
}

async function runPosAiInference<T extends Record<string, unknown>>(
  context: PosPlatformContext,
  task: string,
  data: Record<string, unknown>,
  instructions?: string,
): Promise<T | null> {
  const platform = await resolveBusinessContextFromModule(toModulePlatform(context));
  return runModuleAiJsonTask<T>(platform, {
    module: MODULE_NAME,
    task,
    context: data,
    instructions,
  });
}

export async function buildPosAiContext(
  context: PosPlatformContext,
  orderId: string,
): Promise<PosAiContext | null> {
  const record = await posService.getById(context, orderId);

  if (!record) {
    return null;
  }

  return {
    ...record.aiContext,
    summary: getPosOrderSummary(record),
    insights: [
      ...record.aiContext.insights,
      `Status: ${record.order.status}`,
      `Total: £${(record.order.totalCents / 100).toFixed(2)}`,
    ],
    lastGeneratedAt: new Date().toISOString(),
  };
}

export async function createSaleForAi(
  context: PosPlatformContext,
  items: Array<{ menuItemId: string; name: string; quantity: number; unitPriceCents: number }>,
): Promise<Record<string, unknown>> {
  const record = await posService.createSale(context, {
    sessionId: `${context.branchId}-pos-session`,
    source: "dine_in",
    items,
  });

  return {
    orderId: record.order.id,
    orderNumber: record.order.orderNumber,
    totalCents: record.order.totalCents,
    itemCount: record.cartItems.length,
  };
}

export async function applyDiscountForAi(
  context: PosPlatformContext,
  orderId: string,
  valueBps: number,
  label: string,
): Promise<Record<string, unknown> | null> {
  const updated = await posService.applyDiscount(context, {
    orderId,
    discountType: "percentage",
    label,
    valueBps,
    appliedByEmployeeId: context.userId,
  });

  if (!updated) {
    return null;
  }

  return {
    orderId,
    discountCents: updated.order.discountCents,
    newTotalCents: updated.order.totalCents,
  };
}

export async function splitBillForAi(
  context: PosPlatformContext,
  orderId: string,
  splitCount: number,
): Promise<Record<string, unknown> | null> {
  const updated = await posService.splitBill(context, {
    orderId,
    splitCount,
    splitMethod: "equal",
  });

  if (!updated?.splitBill) {
    return null;
  }

  return {
    orderId,
    splitCount: updated.splitBill.splitCount,
    portions: updated.splitBill.portions.map((portion) => ({
      label: portion.label,
      amountCents: portion.amountCents,
    })),
  };
}

export async function recommendUpsells(
  context: PosPlatformContext,
  orderId: string,
): Promise<Record<string, unknown> | null> {
  const record = await posService.getById(context, orderId);

  if (!record) {
    return null;
  }

  const dataContext = {
    orderId,
    currentItems: record.cartItems.map((item) => item.name),
    suggestedUpsells: record.aiContext.suggestedUpsells,
    totalCents: record.order.totalCents,
  };

  const aiResult = await runPosAiInference<Record<string, unknown>>(
    context,
    "recommendUpsells",
    dataContext,
    "Recommend upsells for POS order. Return JSON with orderId, currentItems, suggestions array (name, rationale, estimatedPriceCents).",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    orderId,
    currentItems: record.cartItems.map((item) => item.name),
    suggestedUpsells: record.aiContext.suggestedUpsells,
  };
}

export async function predictBusyHours(context: PosPlatformContext): Promise<Record<string, unknown>> {
  const snapshot = await buildPosPlatformSnapshot(context);
  const openOrders = await getOpenPosOrders(context, 20);
  const dataContext = {
    branchId: snapshot.context.branchId,
    currentOpenOrders: openOrders.length,
    totalSalesCents: snapshot.totalSalesCents,
    avgTicketCents: snapshot.avgTicketCents,
    busyHourScore: snapshot.records[0]?.aiContext.busyHourScore,
  };

  const aiResult = await runPosAiInference<Record<string, unknown>>(
    context,
    "predictBusyHours",
    dataContext,
    "Predict busy hours. Return JSON with branchId, currentOpenOrders, peakHour, peakScore, hourlyForecast, and recommendation.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function detectSuspiciousRefunds(
  context: PosPlatformContext,
  limit = 5,
): Promise<Record<string, unknown>> {
  const records = (await posService.list(context))
    .filter((record) => record.refunds.length > 0)
    .sort((a, b) => b.aiContext.suspiciousRefundScore - a.aiContext.suspiciousRefundScore)
    .slice(0, limit);

  const suspicious = records.filter(
    (record) =>
      record.refunds.some((refund) => refund.isSuspicious) ||
      record.aiContext.suspiciousRefundScore > 0.5,
  );

  const dataContext = {
    totalRefunds: records.length,
    suspiciousCount: suspicious.length,
    refunds: records.map(toRefundSummary),
    flagged: suspicious.map(toRefundSummary),
  };

  const aiResult = await runPosAiInference<Record<string, unknown>>(
    context,
    "detectSuspiciousRefunds",
    dataContext,
    "Detect suspicious refunds. Return JSON with totalRefunds, suspiciousCount, refunds, flagged, and recommendedActions.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function suggestPromotions(context: PosPlatformContext): Promise<Record<string, unknown>> {
  const snapshot = await buildPosPlatformSnapshot(context);
  const openOrders = snapshot.records.filter((record) => record.order.status === POS_ORDER_STATUSES.OPEN);
  const dataContext = {
    branchId: snapshot.context.branchId,
    openOrderCount: openOrders.length,
    totalSalesCents: snapshot.totalSalesCents,
    avgTicketCents: snapshot.avgTicketCents,
  };

  const aiResult = await runPosAiInference<Record<string, unknown>>(
    context,
    "suggestPromotions",
    dataContext,
    "Suggest POS promotions. Return JSON with branchId, openOrderCount, promotions array (code, label, targetItems), and rationale.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function forecastRevenue(context: PosPlatformContext): Promise<Record<string, unknown>> {
  const snapshot = await buildPosPlatformSnapshot(context);
  const dataContext = {
    branchId: snapshot.context.branchId,
    currentShiftSalesCents: snapshot.totalSalesCents,
    avgTicketCents: snapshot.avgTicketCents,
    busyHourScore: snapshot.records[0]?.aiContext.busyHourScore,
  };

  const aiResult = await runPosAiInference<Record<string, unknown>>(
    context,
    "forecastRevenue",
    dataContext,
    "Forecast POS revenue. Return JSON with branchId, currentShiftSalesCents, todayForecastCents, weekForecastCents, avgTicketCents, and confidence.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function predictSales(context: PosPlatformContext): Promise<Record<string, unknown>> {
  const snapshot = await buildPosPlatformSnapshot(context);
  const openOrders = await getOpenPosOrders(context, 20);
  const dataContext = {
    branchId: snapshot.context.branchId,
    currentShiftSalesCents: snapshot.totalSalesCents,
    avgTicketCents: snapshot.avgTicketCents,
    currentOpenOrders: openOrders.length,
    busyHourScore: snapshot.records[0]?.aiContext.busyHourScore,
  };

  const aiResult = await runPosAiInference<Record<string, unknown>>(
    context,
    "predictSales",
    dataContext,
    "Predict sales. Return JSON with branchId, currentShiftSalesCents, todayForecastCents, peakHour, peakScore, and confidence.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function detectFraud(context: PosPlatformContext): Promise<Record<string, unknown>> {
  return detectSuspiciousRefunds(context, 10);
}

export async function analyzePeakHours(context: PosPlatformContext): Promise<Record<string, unknown>> {
  const snapshot = await buildPosPlatformSnapshot(context);
  const openOrders = await getOpenPosOrders(context, 20);
  const dataContext = {
    branchId: snapshot.context.branchId,
    currentOpenOrders: openOrders.length,
    totalSalesCents: snapshot.totalSalesCents,
    avgTicketCents: snapshot.avgTicketCents,
  };

  const aiResult = await runPosAiInference<Record<string, unknown>>(
    context,
    "analyzePeakHours",
    dataContext,
    "Analyze peak hours. Return JSON with branchId, currentOpenOrders, peakHour, peakScore, hourlyForecast, and insights.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

function toRefundSummary(record: PosRecord): Record<string, unknown> {
  const refund = record.refunds[0];

  return {
    orderId: record.order.id,
    orderNumber: record.order.orderNumber,
    refundAmountCents: refund?.amountCents ?? 0,
    reason: refund?.reason ?? "unknown",
    suspiciousScore: record.aiContext.suspiciousRefundScore,
    isSuspicious: refund?.isSuspicious ?? false,
  };
}
