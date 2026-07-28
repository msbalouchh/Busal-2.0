import { ApiGatewayLists } from "@/modules/api-gateway/components/api-gateway-lists";
import { getApiGatewayRoutesContext } from "@/modules/api-gateway/lib/get-api-gateway-context";

export default async function ApiGatewayRoutesPage() {
  const { routes } = await getApiGatewayRoutesContext();
  return <ApiGatewayLists routes={routes} />;
}
