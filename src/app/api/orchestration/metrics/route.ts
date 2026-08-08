import { handleOrchestrationMetrics } from "@/modules/platform-orchestration/api/orchestration-route-handlers";

export async function GET(request: Request) {
  return handleOrchestrationMetrics(request);
}
