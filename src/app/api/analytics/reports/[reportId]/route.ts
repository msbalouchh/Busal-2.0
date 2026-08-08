import { handleDeleteReport } from "@/modules/analytics/api/analytics-route-handlers";

export async function DELETE(_request: Request, { params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  return handleDeleteReport(_request, reportId);
}
