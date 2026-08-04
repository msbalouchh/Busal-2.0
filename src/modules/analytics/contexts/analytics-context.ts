import { createContext } from "react";

import type { AnalyticsContextValue } from "@/modules/analytics/types/analytics-platform";

export const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);
