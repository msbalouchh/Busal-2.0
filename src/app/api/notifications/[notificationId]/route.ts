import { handleMarkNotificationRead } from "@/modules/notifications/api/notification-route-handlers";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ notificationId: string }> },
) {
  const { notificationId } = await context.params;
  return handleMarkNotificationRead(request, notificationId);
}
