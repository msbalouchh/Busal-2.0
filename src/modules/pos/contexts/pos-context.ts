import { createContext } from "react";

import type { PosContextValue } from "@/modules/pos/types/pos-platform";

export const PosContext = createContext<PosContextValue | null>(null);
