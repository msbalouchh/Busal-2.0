import { handleApproveStaffLeave, handleCreateStaffLeave } from "@/modules/staff/api/staff-route-handlers";

export async function POST(request: Request) {
  return handleCreateStaffLeave(request);
}

export async function PATCH(request: Request) {
  return handleApproveStaffLeave(request);
}
