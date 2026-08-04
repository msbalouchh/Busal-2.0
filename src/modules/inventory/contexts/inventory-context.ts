import { createContext } from "react";

import type { InventoryContextValue } from "@/modules/inventory/types/inventory-platform";

export const InventoryContext = createContext<InventoryContextValue | null>(null);
