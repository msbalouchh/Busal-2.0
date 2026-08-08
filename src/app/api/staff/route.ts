import {
  handleBulkStaffAction,
  handleCreateStaffMember,
  handleListStaffMembers,
} from "@/modules/staff/api/staff-route-handlers";

export async function GET(request: Request) {
  return handleListStaffMembers(request);
}

export async function POST(request: Request) {
  return handleCreateStaffMember(request);
}

export async function PATCH(request: Request) {
  return handleBulkStaffAction(request);
}
