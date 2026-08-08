import {
  handleListPosTransactions,
  handlePosSnapshot,
} from "@/modules/pos/api/pos-route-handlers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("snapshot") === "true") {
    return handlePosSnapshot();
  }
  return handleListPosTransactions(request);
}
