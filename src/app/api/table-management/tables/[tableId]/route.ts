import {
  handleArchiveTable,
  handleAssignTable,
  handleGetTable,
  handleRestoreTable,
  handleUpdateTable,
} from "@/modules/table-management/api/tables-route-handlers";

interface RouteContext {
  params: Promise<{ tableId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { tableId } = await context.params;
  return handleGetTable(_request, tableId);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { tableId } = await context.params;
  return handleUpdateTable(request, tableId);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { tableId } = await context.params;
  return handleArchiveTable(_request, tableId);
}

export async function PUT(request: Request, context: RouteContext) {
  const { tableId } = await context.params;
  const url = new URL(request.url);
  if (url.searchParams.get("action") === "restore") {
    return handleRestoreTable(request, tableId);
  }
  if (url.searchParams.get("action") === "assign") {
    return handleAssignTable(request, tableId);
  }
  return handleUpdateTable(request, tableId);
}
