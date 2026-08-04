"use client";

import { useContext } from "react";

import { IntegrationContext } from "@/modules/integrations/contexts/integration-context";
import type { IntegrationContextValue } from "@/modules/integrations/types/integration-platform";

export function useIntegrationContext(): IntegrationContextValue {
  const context = useContext(IntegrationContext);

  if (!context) {
    throw new Error("useIntegrationContext must be used within IntegrationProvider");
  }

  return context;
}

export function useIntegrations(): IntegrationContextValue {
  return useIntegrationContext();
}
