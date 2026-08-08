import { handleNotificationQueue } from "@/modules/notifications/api/notification-route-handlers";

export async function GET(request: Request) {
  return handleNotificationQueue(request);
}
