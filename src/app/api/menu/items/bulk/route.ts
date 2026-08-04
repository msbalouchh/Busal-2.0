import {
  handleBulkDeleteMenuItems,
  handleBulkUpdateMenuItems,
} from "@/modules/menu/api/menu-route-handlers";

export async function PATCH(request: Request) {
  return handleBulkUpdateMenuItems(request);
}

export async function DELETE(request: Request) {
  return handleBulkDeleteMenuItems(request);
}
