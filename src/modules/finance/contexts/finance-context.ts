import { createContext } from "react";

import type { FinanceContextValue } from "@/modules/finance/types/finance-platform";

export const FinanceContext = createContext<FinanceContextValue | null>(null);
