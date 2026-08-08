import { handleNotificationAnalytics } from "@/modules/notifications/api/notification-route-handlers";

export async function GET(request: Request) {
  return handleNotificationAnalytics(request);
}
