"use client";

import { useMemo } from "react";

import { useIntegrations } from "@/modules/integrations/hooks/use-integrations";
import type { IntegrationDeveloperContextValue } from "@/modules/integrations/types/integration-platform";

export function useIntegrationDeveloper(): IntegrationDeveloperContextValue {
  const { record, refresh } = useIntegrations();

  const applications = useMemo(() => record.developerApplications, [record.developerApplications]);
  const apiKeys = useMemo(() => record.apiKeys, [record.apiKeys]);
  const tokens = useMemo(() => record.developerTokens, [record.developerTokens]);

  return {
    applications,
    apiKeys,
    tokens,
    refresh,
  };
}
