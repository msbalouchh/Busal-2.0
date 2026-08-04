import { createContext } from "react";

import type { StaffContextValue } from "@/modules/staff/types/staff-platform";

export const StaffContext = createContext<StaffContextValue | null>(null);
