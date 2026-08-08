import { handleGetKitchenQueue } from "@/modules/kitchen/api/kitchen-route-handlers";

export async function GET(
  _request: Request,
  context: { params: Promise<{ queueId: string }> },
) {
  const { queueId } = await context.params;
  return handleGetKitchenQueue(_request, queueId);
}
