import { handleAnalyticsAlerts } from "@/modules/analytics/api/analytics-route-handlers";

export async function GET() {
  return handleAnalyticsAlerts(new Request("http://localhost"));
}
