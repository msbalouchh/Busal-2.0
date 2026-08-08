import { handleClosePosShift } from "@/modules/pos/api/pos-route-handlers";

export async function POST(
  request: Request,
  context: { params: Promise<{ shiftId: string }> },
) {
  const { shiftId } = await context.params;
  return handleClosePosShift(request, shiftId);
}
