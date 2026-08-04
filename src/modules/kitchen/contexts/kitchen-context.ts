import { createContext } from "react";

import type { KitchenContextValue } from "@/modules/kitchen/types/kitchen";

export const KitchenContext = createContext<KitchenContextValue | null>(null);
