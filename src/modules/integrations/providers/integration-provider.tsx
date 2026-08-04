"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { IntegrationContext } from "@/modules/integrations/contexts/integration-context";
import { integrationRepository } from "@/modules/integrations/repository/integration-repository";
import {
  buildIntegrationPlatformContext,
  buildIntegrationPlatformSnapshot,
  type IntegrationPlatformInput,
} from "@/modules/integrations/services/integration-platform.service";
import type { IntegrationContextValue } from "@/modules/integrations/types/integration-platform";

interface IntegrationProviderProps {
  children: ReactNode;
  initialInput?: IntegrationPlatformInput;
}

export function IntegrationProvider({ children, initialInput }: IntegrationProviderProps) {
  const [input] = useState<IntegrationPlatformInput>(() => initialInput ?? {});
  const [snapshot, setSnapshot] = useState(() => buildIntegrationPlatformSnapshot(input));
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setSnapshot(buildIntegrationPlatformSnapshot(input));
  }, [input]);

  const value = useMemo<IntegrationContextValue>(() => {
    const context = buildIntegrationPlatformContext(input);
    const selectedIntegration = selectedIntegrationId
      ? (integrationRepository.findIntegrationById(selectedIntegrationId) ?? null)
      : null;

    return {
      context,
      record: snapshot.record,
      selectedIntegrationId,
      selectedIntegration,
      selectIntegration: setSelectedIntegrationId,
      refresh,
    };
  }, [input, snapshot, selectedIntegrationId, refresh]);

  return <IntegrationContext.Provider value={value}>{children}</IntegrationContext.Provider>;
}
