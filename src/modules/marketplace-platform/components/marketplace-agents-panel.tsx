"use client";

import { useState, useTransition } from "react";

import { installMarketplacePlatformItemAction } from "@/modules/marketplace-platform/actions/marketplace-platform-actions";
import { MarketplaceItemGrid } from "@/modules/marketplace-platform/components/marketplace-item-card";
import type { MarketplacePlatformPermissions } from "@/modules/marketplace-platform/types/marketplace-platform-types";
import type { MarketplaceItemView } from "@/modules/marketplace/utils/marketplace-utils";

interface MarketplaceAgentsPanelProps {
  permissions: MarketplacePlatformPermissions;
  agents: MarketplaceItemView[];
  installations: MarketplaceItemView[];
}

export function MarketplaceAgentsPanel({
  permissions,
  agents,
  installations,
}: MarketplaceAgentsPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const installedSlugs = new Set(installations.map((item) => item.slug));

  return (
    <div className="space-y-6">
      {message ? (
        <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-destructive rounded-lg border p-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <MarketplaceItemGrid
        items={agents}
        emptyMessage="No AI agents available in the marketplace yet."
      />

      {permissions.canInstall ? (
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Quick install</h2>
          <div className="flex flex-wrap gap-2">
            {agents.slice(0, 6).map((agent) => (
              <button
                key={agent.id}
                type="button"
                disabled={isPending || installedSlugs.has(agent.slug)}
                className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                onClick={() => {
                  setMessage(null);
                  setError(null);
                  startTransition(async () => {
                    try {
                      await installMarketplacePlatformItemAction(agent.id);
                      setMessage(`${agent.name} installed successfully.`);
                    } catch (installError) {
                      setError(
                        installError instanceof Error ? installError.message : "Install failed",
                      );
                    }
                  });
                }}
              >
                {installedSlugs.has(agent.slug)
                  ? `${agent.name} installed`
                  : `Install ${agent.name}`}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground mt-3 text-sm">
            Configure and assign installed agents from the AI Agents module.
          </p>
        </div>
      ) : null}
    </div>
  );
}
