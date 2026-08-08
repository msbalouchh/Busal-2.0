import {
  handleKitchenSnapshot,
  handleListKitchenOrders,
} from "@/modules/kitchen/api/kitchen-route-handlers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("snapshot") === "true") {
    return handleKitchenSnapshot();
  }
  return handleListKitchenOrders(request);
}
