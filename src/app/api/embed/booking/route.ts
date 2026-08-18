import "server-only";

import { NextResponse } from "next/server";

import { verifyEmbedToken } from "@/modules/platform/services/platform-embed.service";
import { loadPlatformConsumptionConfig } from "@/modules/platform/lib/platform-settings";
import { resolvePlatformEntitlements } from "@/modules/platform/services/platform-entitlements.service";
import { resolveOrderScopeFromBusiness } from "@/modules/orders/lib/order-scope";
import {
  buildReservationScopeFromInput,
  toReservationPlatformContext,
} from "@/modules/reservations/lib/reservation-scope";
import { reservationService } from "@/modules/reservations/services/reservation.service";
import { createReservationSchema } from "@/modules/reservations/validation/reservation-schemas";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body.token ?? "");
    const payload = verifyEmbedToken(token);

    if (!payload || payload.widgetType !== "booking") {
      return NextResponse.json({ success: false, error: "Invalid embed token" }, { status: 401 });
    }

    if (payload.businessId !== body.businessId) {
      return NextResponse.json({ success: false, error: "Tenant mismatch" }, { status: 403 });
    }

    const tenant = await prisma.tenantRecord.findUnique({
      where: { businessId: payload.businessId },
      select: { subscriptionPlan: true },
    });

    if (!resolvePlatformEntitlements(tenant?.subscriptionPlan).embed) {
      return NextResponse.json({ success: false, error: "Embed not enabled for plan" }, { status: 403 });
    }

    const config = await loadPlatformConsumptionConfig(payload.businessId);
    if (!config.embed.enabled) {
      return NextResponse.json({ success: false, error: "Embeds disabled" }, { status: 403 });
    }

    const referer = request.headers.get("referer") ?? "";
    if (payload.origin && referer && !referer.includes(new URL(payload.origin).host)) {
      return NextResponse.json({ success: false, error: "Origin not allowed" }, { status: 403 });
    }

    const orderScope = await resolveOrderScopeFromBusiness(payload.businessId);
    if (!orderScope.branchId) {
      return NextResponse.json({ success: false, error: "Branch not configured" }, { status: 400 });
    }

    const scope = buildReservationScopeFromInput({
      businessId: payload.businessId,
      branchId: orderScope.branchId,
    });
    const context = toReservationPlatformContext(scope);

    const parsed = createReservationSchema.parse({
      customerName: body.customerName,
      guestFirstName: body.customerName,
      partySize: body.partySize,
      scheduledDate: body.date,
      startTime: body.time,
      branchId: orderScope.branchId,
    });

    const record = await reservationService.create(context, {
      ...parsed,
      branchId: orderScope.branchId,
    });
    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Booking failed" },
      { status: 500 },
    );
  }
}
