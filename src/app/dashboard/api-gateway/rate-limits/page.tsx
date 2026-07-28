import { ApiGatewayLists } from "@/modules/api-gateway/components/api-gateway-lists";
import { getApiGatewayRateLimitsContext } from "@/modules/api-gateway/lib/get-api-gateway-context";

export default async function ApiGatewayRateLimitsPage() {
  const { policies } = await getApiGatewayRateLimitsContext();
  return <ApiGatewayLists policies={policies} />;
}
