import { ApiGatewayLists } from "@/modules/api-gateway/components/api-gateway-lists";
import { getApiGatewayAuditContext } from "@/modules/api-gateway/lib/get-api-gateway-context";

export default async function ApiGatewayAuditPage() {
  const { auditLogs } = await getApiGatewayAuditContext();
  return <ApiGatewayLists auditLogs={auditLogs} />;
}
