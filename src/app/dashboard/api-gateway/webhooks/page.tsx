import { ApiGatewayLists } from "@/modules/api-gateway/components/api-gateway-lists";
import { getApiGatewayWebhooksContext } from "@/modules/api-gateway/lib/get-api-gateway-context";

export default async function ApiGatewayWebhooksPage() {
  const { registrations, deliveries } = await getApiGatewayWebhooksContext();
  return <ApiGatewayLists webhooks={registrations} deliveries={deliveries} />;
}
