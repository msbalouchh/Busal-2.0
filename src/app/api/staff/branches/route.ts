import { handleAssignStaffBranch } from "@/modules/staff/api/staff-route-handlers";

export async function POST(request: Request) {
  return handleAssignStaffBranch(request);
}
