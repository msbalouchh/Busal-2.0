"use client";

import { useMemo } from "react";

import { useIntegrations } from "@/modules/integrations/hooks/use-integrations";
import { getFailedWebhookCount } from "@/modules/integrations/utils/integration-selectors";
import type { IntegrationWebhooksContextValue } from "@/modules/integrations/types/integration-platform";

export function useIntegrationWebhooks(): IntegrationWebhooksContextValue {
  const { record, refresh } = useIntegrations();

  const webhooks = useMemo(() => record.webhooks, [record.webhooks]);
  const webhookEvents = useMemo(() => record.webhookEvents, [record.webhookEvents]);

  const failedEventCount = useMemo(() => getFailedWebhookCount(webhookEvents), [webhookEvents]);

  return {
    webhooks,
    webhookEvents,
    failedEventCount,
    refresh,
  };
}
