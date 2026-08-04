import { createContext } from "react";

import type { BillingContextValue } from "@/modules/billing/types/billing-platform";

export const BillingContext = createContext<BillingContextValue | null>(null);
