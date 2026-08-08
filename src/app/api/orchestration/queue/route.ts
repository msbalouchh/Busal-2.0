import { handleProcessQueue } from "@/modules/platform-orchestration/api/orchestration-route-handlers";

export async function GET(request: Request) {
  return handleProcessQueue(request);
}

export async function POST(request: Request) {
  return handleProcessQueue(request);
}
