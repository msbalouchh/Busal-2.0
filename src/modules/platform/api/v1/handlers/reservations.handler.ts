import "server-only";

import { NextResponse } from "next/server";

import { resolveOrderScopeFromBusiness } from "@/modules/orders/lib/order-scope";
import { jsonSuccess, withPlatformApiAuth } from "@/modules/platform/api/v1/platform-api-handler";
import { PLATFORM_API_SCOPES } from "@/modules/platform/constants/api-scopes";
import {
  buildReservationScopeFromInput,
  toReservationPlatformContext,
} from "@/modules/reservations/lib/reservation-scope";
import { reservationService } from "@/modules/reservations/services/reservation.service";
import { reservationSearchSchema } from "@/modules/reservations/validation/reservation-schemas";

export async function handleV1ListReservations(request: Request) {
  return withPlatformApiAuth(request, [PLATFORM_API_SCOPES.RESERVATIONS_READ], async (auth) => {
    const orderScope = await resolveOrderScopeFromBusiness(auth.businessId);
    const scope = buildReservationScopeFromInput({
      businessId: auth.businessId,
      branchId: orderScope.branchId,
    });
    const context = toReservationPlatformContext(scope);
    const url = new URL(request.url);
    const parsed = reservationSearchSchema.parse(Object.fromEntries(url.searchParams.entries()));
    const result = await reservationService.search(parsed, context);
    return jsonSuccess(result);
  });
}

export async function handleV1GetReservation(request: Request, reservationId: string) {
  return withPlatformApiAuth(request, [PLATFORM_API_SCOPES.RESERVATIONS_READ], async (auth) => {
    const orderScope = await resolveOrderScopeFromBusiness(auth.businessId);
    const scope = buildReservationScopeFromInput({
      businessId: auth.businessId,
      branchId: orderScope.branchId,
    });
    const context = toReservationPlatformContext(scope);
    const record = await reservationService.getById(context, reservationId);

    if (!record) {
      return NextResponse.json({ success: false, error: "Reservation not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  });
}
