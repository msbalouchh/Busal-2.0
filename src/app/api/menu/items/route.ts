import { handleCreateMenuItem, handleListMenuItems } from "@/modules/menu/api/menu-route-handlers";

export const GET = handleListMenuItems;
export const POST = handleCreateMenuItem;
