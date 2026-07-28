import { ApiGatewayLists } from "@/modules/api-gateway/components/api-gateway-lists";
import { getApiGatewayOpenApiContext } from "@/modules/api-gateway/lib/get-api-gateway-context";

export default async function ApiGatewayOpenApiPage() {
  const { entries } = await getApiGatewayOpenApiContext();
  return <ApiGatewayLists openapi={entries} />;
}
