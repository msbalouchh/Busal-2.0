import {
  handleDeactivateStaffMember,
  handleGetStaffMember,
  handleRestoreStaffMember,
  handleUpdateStaffMember,
} from "@/modules/staff/api/staff-route-handlers";

export async function GET(_request: Request, context: { params: Promise<{ staffId: string }> }) {
  const { staffId } = await context.params;
  return handleGetStaffMember(_request, staffId);
}

export async function PATCH(request: Request, context: { params: Promise<{ staffId: string }> }) {
  const { staffId } = await context.params;
  return handleUpdateStaffMember(request, staffId);
}

export async function DELETE(_request: Request, context: { params: Promise<{ staffId: string }> }) {
  const { staffId } = await context.params;
  return handleDeactivateStaffMember(_request, staffId);
}

export async function PUT(_request: Request, context: { params: Promise<{ staffId: string }> }) {
  const { staffId } = await context.params;
  return handleRestoreStaffMember(_request, staffId);
}
