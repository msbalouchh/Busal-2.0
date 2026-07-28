import { ApiGatewayLists } from "@/modules/api-gateway/components/api-gateway-lists";
import { getApiGatewayRegistryContext } from "@/modules/api-gateway/lib/get-api-gateway-context";

export default async function ApiGatewayRegistryPage() {
  const { registrations } = await getApiGatewayRegistryContext();
  return <ApiGatewayLists registrations={registrations} />;
}
