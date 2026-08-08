import { handleAnalyticsReports } from "@/modules/analytics/api/analytics-route-handlers";

export async function GET() {
  return handleAnalyticsReports(new Request("http://localhost"));
}
