import { createContext } from "react";

import type { IntegrationContextValue } from "@/modules/integrations/types/integration-platform";

export const IntegrationContext = createContext<IntegrationContextValue | null>(null);
