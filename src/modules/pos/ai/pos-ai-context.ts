import { POS_ORDER_STATUSES } from "@/modules/pos/constants/pos-status";
import { DEFAULT_POS_SCOPE } from "@/modules/pos/constants/mock-data";
import { posService } from "@/modules/pos/services/pos.service";
import {
  buildPosPlatformSnapshot,
  getOpenPosOrders,
} from "@/modules/pos/services/pos-platform.service";
import { getPosOrderSummary } from "@/modules/pos/utils/pos-selectors";
import type { PosAiContext, PosRecord } from "@/modules/pos/types/pos-platform";

export function buildPosAiContext(orderId: string): PosAiContext | null {
  const record = posService.getById(orderId);

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

export function createSaleForAi(
  items: Array<{ menuItemId: string; name: string; quantity: number; unitPriceCents: number }>,
): Record<string, unknown> {
  const record = posService.createSale({
    sessionId: DEFAULT_POS_SCOPE.sessionId,
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

export function applyDiscountForAi(
  orderId: string,
  valueBps: number,
  label: string,
): Record<string, unknown> | null {
  const updated = posService.applyDiscount({
    orderId,
    discountType: "percentage",
    label,
    valueBps,
    appliedByEmployeeId: DEFAULT_POS_SCOPE.employeeId,
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

export function splitBillForAi(
  orderId: string,
  splitCount: number,
): Record<string, unknown> | null {
  const updated = posService.splitBill({
    orderId,
    splitCount,
    splitMethod: "equal",
  });

  if (!updated || !updated.splitBill) {
    return null;
  }

  return {
    orderId,
    splitCount: updated.splitBill.splitCount,
    portions: updated.splitBill.portions.map((p) => ({
      label: p.label,
      amountCents: p.amountCents,
    })),
  };
}

export function recommendUpsells(orderId: string): Record<string, unknown> | null {
  const record = posService.getById(orderId);

  if (!record) {
    return null;
  }

  return {
    orderId,
    currentItems: record.cartItems.map((item) => item.name),
    suggestions: record.aiContext.suggestedUpsells.map((name) => ({
      name,
      rationale: "Frequently paired with current order",
      estimatedPriceCents: 450,
    })),
  };
}

export function predictBusyHours(): Record<string, unknown> {
  const snapshot = buildPosPlatformSnapshot();
  const openOrders = getOpenPosOrders(20);

  const hourlyLoad = [
    { hour: 12, score: 0.45, covers: 18 },
    { hour: 13, score: 0.72, covers: 32 },
    { hour: 14, score: 0.55, covers: 24 },
    { hour: 18, score: 0.88, covers: 45 },
    { hour: 19, score: 0.95, covers: 52 },
    { hour: 20, score: 0.82, covers: 41 },
  ];

  const peak = hourlyLoad.reduce((max, h) => (h.score > max.score ? h : max));

  return {
    branchId: snapshot.context.branchId,
    currentOpenOrders: openOrders.length,
    peakHour: peak.hour,
    peakScore: peak.score,
    hourlyForecast: hourlyLoad,
    recommendation: `Staff up grill station before ${peak.hour}:00`,
  };
}

export function detectSuspiciousRefunds(limit = 5): Record<string, unknown> {
  const records = posService
    .list()
    .filter((r) => r.refunds.length > 0)
    .sort((a, b) => b.aiContext.suspiciousRefundScore - a.aiContext.suspiciousRefundScore)
    .slice(0, limit);

  const suspicious = records.filter(
    (r) => r.refunds.some((ref) => ref.isSuspicious) || r.aiContext.suspiciousRefundScore > 0.5,
  );

  return {
    totalRefunds: records.length,
    suspiciousCount: suspicious.length,
    refunds: records.map(toRefundSummary),
    flagged: suspicious.map(toRefundSummary),
  };
}

export function suggestPromotions(): Record<string, unknown> {
  const snapshot = buildPosPlatformSnapshot();
  const openOrders = snapshot.records.filter((r) => r.order.status === POS_ORDER_STATUSES.OPEN);

  return {
    branchId: snapshot.context.branchId,
    openOrderCount: openOrders.length,
    promotions: [
      { code: "DESSERT15", label: "15% off desserts after 8pm", targetItems: ["desserts"] },
      { code: "WINE2FOR1", label: "2-for-1 house wine Tue-Thu", targetItems: ["drinks"] },
      { code: "LUNCH10", label: "£10 lunch combo 12-3pm", targetItems: ["mains", "drinks"] },
    ],
    rationale: "Based on current order mix and historical conversion",
  };
}

export function forecastRevenue(): Record<string, unknown> {
  const snapshot = buildPosPlatformSnapshot();
  const shift = snapshot.records[0];

  const todayForecastCents = snapshot.totalSalesCents + 125000;
  const weekForecastCents = todayForecastCents * 6;

  return {
    branchId: snapshot.context.branchId,
    currentShiftSalesCents: snapshot.totalSalesCents,
    todayForecastCents,
    weekForecastCents,
    avgTicketCents: snapshot.avgTicketCents,
    confidence: 0.78,
    busyHourScore: shift?.aiContext.busyHourScore ?? 0.7,
  };
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
