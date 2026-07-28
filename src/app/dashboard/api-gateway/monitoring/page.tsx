import { ApiGatewayLists } from "@/modules/api-gateway/components/api-gateway-lists";
import { getApiGatewayMonitoringContext } from "@/modules/api-gateway/lib/get-api-gateway-context";

export default async function ApiGatewayMonitoringPage() {
  const { logs } = await getApiGatewayMonitoringContext();
  return <ApiGatewayLists logs={logs} />;
}
