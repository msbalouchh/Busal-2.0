import {
  handleCancelReservation,
  handleGetReservation,
  handleUpdateReservation,
} from "@/modules/reservations/api/reservations-route-handlers";

interface RouteContext {
  params: Promise<{ reservationId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { reservationId } = await context.params;
  return handleGetReservation(request, reservationId);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { reservationId } = await context.params;
  return handleUpdateReservation(request, reservationId);
}

export async function DELETE(request: Request, context: RouteContext) {
  const { reservationId } = await context.params;
  return handleCancelReservation(request, reservationId);
}
