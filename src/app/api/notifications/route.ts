import {
  handleBulkNotifications,
  handleCreateCampaign,
  handleCreateRule,
  handleCreateTemplate,
  handleListNotifications,
  handleRetryDelivery,
  handleSendNotification,
  handleUpdatePreference,
  handleWebhook,
} from "@/modules/notifications/api/notification-route-handlers";

export async function GET(request: Request) {
  return handleListNotifications(request);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const resource = url.searchParams.get("resource");

  switch (resource) {
    case "bulk":
      return handleBulkNotifications(request);
    case "template":
      return handleCreateTemplate(request);
    case "rule":
      return handleCreateRule(request);
    case "campaign":
      return handleCreateCampaign(request);
    case "preference":
      return handleUpdatePreference(request);
    case "retry":
      return handleRetryDelivery(request);
    case "webhook":
      return handleWebhook(request);
    default:
      return handleSendNotification(request);
  }
}
