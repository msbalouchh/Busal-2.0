import { handleIntegrationUsage } from "@/modules/integrations/api/integration-route-handlers";

export async function GET(request: Request) {
  return handleIntegrationUsage(request);
}
