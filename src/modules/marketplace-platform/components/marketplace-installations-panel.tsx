"use client";

import { useState, useTransition } from "react";

import {
  rollbackMarketplacePlatformInstallationAction,
  uninstallMarketplacePlatformItemAction,
} from "@/modules/marketplace-platform/actions/marketplace-platform-actions";
import type { MarketplacePlatformPermissions } from "@/modules/marketplace-platform/types/marketplace-platform-types";
import type {
  MarketplaceHistoryView,
  MarketplaceInstallationView,
} from "@/modules/marketplace/utils/marketplace-utils";

interface MarketplaceInstallationsPanelProps {
  permissions: MarketplacePlatformPermissions;
  installations: MarketplaceInstallationView[];
  history: MarketplaceHistoryView[];
}

export function MarketplaceInstallationsPanel({
  permissions,
  installations,
  history,
}: MarketplaceInstallationsPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runAction = (action: () => Promise<unknown>, successMessage: string) => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await action();
        setMessage(successMessage);
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Action failed");
      }
    });
  };

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

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 font-semibold">Installed extensions</h2>
        {installations.length === 0 ? (
          <p className="text-muted-foreground text-sm">No installed marketplace items yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Item</th>
                  <th className="px-4 py-2 font-medium">Version</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Installed</th>
                  {permissions.canInstall ? (
                    <th className="px-4 py-2 font-medium">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {installations.map((installation) => (
                  <tr key={installation.id} className="border-t">
                    <td className="px-4 py-2">{installation.itemName}</td>
                    <td className="px-4 py-2">{installation.versionLabel ?? "—"}</td>
                    <td className="px-4 py-2">{installation.status}</td>
                    <td className="px-4 py-2">
                      {new Date(installation.installedAt).toLocaleDateString()}
                    </td>
                    {permissions.canInstall ? (
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isPending}
                            className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
                            onClick={() =>
                              runAction(
                                () =>
                                  rollbackMarketplacePlatformInstallationAction(
                                    installation.itemId,
                                  ),
                                "Rollback completed.",
                              )
                            }
                          >
                            Rollback
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
                            onClick={() =>
                              runAction(
                                () => uninstallMarketplacePlatformItemAction(installation.itemId),
                                "Uninstalled successfully.",
                              )
                            }
                          >
                            Uninstall
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 font-semibold">Installation history</h2>
        {history.length === 0 ? (
          <p className="text-muted-foreground text-sm">No installation history yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Item</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id} className="border-t">
                    <td className="px-4 py-2">{entry.itemName}</td>
                    <td className="px-4 py-2">{entry.action}</td>
                    <td className="px-4 py-2">{entry.status}</td>
                    <td className="px-4 py-2">{new Date(entry.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
