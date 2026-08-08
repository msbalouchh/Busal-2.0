import { handleRecordInventoryWaste } from "@/modules/inventory/api/inventory-route-handlers";

export async function POST(request: Request) {
  return handleRecordInventoryWaste(request);
}
