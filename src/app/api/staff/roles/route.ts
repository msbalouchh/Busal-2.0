import { handleAssignStaffRole } from "@/modules/staff/api/staff-route-handlers";

export async function POST(request: Request) {
  return handleAssignStaffRole(request);
}
