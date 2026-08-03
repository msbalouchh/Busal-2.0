import { createContext } from "react";

import type { TableManagementContextValue } from "@/modules/table-management/types/table-management";

export const TableManagementContext = createContext<TableManagementContextValue | null>(null);
