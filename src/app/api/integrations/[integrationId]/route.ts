import { handleHealthCheck } from "@/modules/integrations/api/integration-route-handlers";

export async function GET(
  request: Request,
  context: { params: Promise<{ integrationId: string }> },
) {
  const { integrationId } = await context.params;
  return handleHealthCheck(request, integrationId);
}
