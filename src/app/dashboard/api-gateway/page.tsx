import { ApiGatewayDashboard } from "@/modules/api-gateway/components/api-gateway-dashboard";
import { getApiGatewayOverviewContext } from "@/modules/api-gateway/lib/get-api-gateway-context";

export default async function ApiGatewayOverviewPage() {
  const { dashboard } = await getApiGatewayOverviewContext();
  return <ApiGatewayDashboard dashboard={dashboard} />;
}
