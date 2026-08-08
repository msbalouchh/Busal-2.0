import { handleStaffAlerts } from "@/modules/staff/api/staff-route-handlers";

export async function GET(request: Request) {
  return handleStaffAlerts(request);
}
