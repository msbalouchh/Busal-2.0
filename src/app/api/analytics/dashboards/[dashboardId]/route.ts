import {
  handleDeleteDashboard,
  handleRestoreDashboard,
} from "@/modules/analytics/api/analytics-route-handlers";

export async function DELETE(_request: Request, { params }: { params: Promise<{ dashboardId: string }> }) {
  const { dashboardId } = await params;
  return handleDeleteDashboard(_request, dashboardId);
}

export async function PATCH(_request: Request, { params }: { params: Promise<{ dashboardId: string }> }) {
  const { dashboardId } = await params;
  return handleRestoreDashboard(_request, dashboardId);
}
