import {
  handleArchiveKitchenStation,
  handleUpdateKitchenStation,
} from "@/modules/kitchen/api/kitchen-route-handlers";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ stationId: string }> },
) {
  const { stationId } = await context.params;
  return handleUpdateKitchenStation(request, stationId);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ stationId: string }> },
) {
  const { stationId } = await context.params;
  return handleArchiveKitchenStation(_request, stationId);
}
