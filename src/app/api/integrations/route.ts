import {
  handleConnectIntegration,
  handleCreateApiKey,
  handleCreateDeveloperApplication,
  handleCreateDeveloperToken,
  handleCreateMapping,
  handleCreateWebhook,
  handleDisconnectIntegration,
  handleListIntegrations,
  handleRetryWebhook,
  handleRevokeApiKey,
  handleRotateApiKey,
  handleUpdateWebhook,
  handleVerifyWebhook,
} from "@/modules/integrations/api/integration-route-handlers";

export async function GET(request: Request) {
  return handleListIntegrations(request);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const resource = url.searchParams.get("resource");

  switch (resource) {
    case "api-key":
      return handleCreateApiKey(request);
    case "revoke-key":
      return handleRevokeApiKey(request);
    case "rotate-key":
      return handleRotateApiKey(request);
    case "webhook":
      return handleCreateWebhook(request);
    case "update-webhook":
      return handleUpdateWebhook(request);
    case "retry-webhook":
      return handleRetryWebhook(request);
    case "verify-webhook":
      return handleVerifyWebhook(request);
    case "connect":
      return handleConnectIntegration(request);
    case "disconnect":
      return handleDisconnectIntegration(request);
    case "developer-app":
      return handleCreateDeveloperApplication(request);
    case "developer-token":
      return handleCreateDeveloperToken(request);
    case "mapping":
      return handleCreateMapping(request);
    default:
      return handleCreateApiKey(request);
  }
}
