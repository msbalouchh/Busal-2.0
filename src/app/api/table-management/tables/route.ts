import { handleCreateTable, handleListTables } from "@/modules/table-management/api/tables-route-handlers";

export const GET = handleListTables;
export const POST = handleCreateTable;
