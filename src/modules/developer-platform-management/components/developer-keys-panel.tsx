"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeveloperPlatformNav } from "@/modules/developer-platform-management/components/developer-platform-nav";
import {
  createApiKeyAction,
  revokeApiKeyAction,
  rotateApiKeyAction,
} from "@/modules/developer-platform-management/actions/developer-platform-actions";
import type { DeveloperPlatformContext } from "@/modules/developer-platform-management/lib/get-developer-platform-context";
import type {
  ApiApplicationRecord,
  ApiKeyRecord,
} from "@/modules/developer-platform-management/types/developer-platform-types";
import { ALL_PLATFORM_API_SCOPES } from "@/modules/platform/constants/api-scopes";

interface DeveloperKeysPanelProps {
  context: DeveloperPlatformContext;
  keys: ApiKeyRecord[];
  applications: ApiApplicationRecord[];
}

export function DeveloperKeysPanel({ context, keys, applications }: DeveloperKeysPanelProps) {
  const [name, setName] = useState("");
  const [applicationId, setApplicationId] = useState(applications[0]?.id ?? "");
  const [expiresAt, setExpiresAt] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    "customers:read",
    "orders:read",
  ]);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleScope(scope: string) {
    setSelectedScopes((current) =>
      current.includes(scope) ? current.filter((entry) => entry !== scope) : [...current, scope],
    );
  }

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!applicationId) return;
    startTransition(async () => {
      const result = await createApiKeyAction({
        applicationId,
        name,
        permissions: selectedScopes,
        expiresAt: expiresAt || undefined,
      });
      if (result.rawKey) {
        setCreatedSecret(result.rawKey);
        toast.success("API key created");
        setName("");
      }
    });
  }

  return (
    <div className="space-y-8">
      <DeveloperPlatformNav />

      {createdSecret ? (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-base">Copy your API key now</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              This secret will not be shown again. Store it securely.
            </p>
            <code className="bg-muted block overflow-x-auto rounded-lg p-3 text-xs">{createdSecret}</code>
            <Button type="button" variant="outline" onClick={() => setCreatedSecret(null)}>
              I have saved the key
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {context.permissionsFlags.canCreate && applications.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create API key</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="key-name">Name</Label>
                  <Input
                    id="key-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key-app">Application</Label>
                  <select
                    id="key-app"
                    className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                    value={applicationId}
                    onChange={(e) => setApplicationId(e.target.value)}
                  >
                    {applications.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="key-expires">Expiration (optional)</Label>
                  <Input
                    id="key-expires"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Scopes</Label>
                <div className="flex flex-wrap gap-2">
                  {ALL_PLATFORM_API_SCOPES.map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => toggleScope(scope)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        selectedScopes.includes(scope)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background"
                      }`}
                    >
                      {scope}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={pending || selectedScopes.length === 0}>
                Create key
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">API keys</CardTitle>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <p className="text-muted-foreground text-sm">No API keys yet.</p>
          ) : (
            <ul className="space-y-3">
              {keys.map((key) => (
                <li key={key.id} className="rounded border p-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium">{key.name}</p>
                      <p className="text-muted-foreground text-xs">{key.applicationName}</p>
                      <p className="text-muted-foreground text-xs">Prefix: {key.keyPrefix}</p>
                      <p className="text-muted-foreground text-xs">
                        Created {new Date(key.createdAt).toLocaleString()}
                        {key.lastUsedAt
                          ? ` · Last used ${new Date(key.lastUsedAt).toLocaleString()}`
                          : " · Never used"}
                      </p>
                      {key.expiresAt ? (
                        <p className="text-muted-foreground text-xs">
                          Expires {new Date(key.expiresAt).toLocaleString()}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {key.permissions.map((scope) => (
                          <Badge key={scope} variant="outline">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{key.status}</Badge>
                      {context.permissionsFlags.canManage ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            startTransition(async () => {
                              const result = await rotateApiKeyAction(key.id);
                              if (result.rawKey) {
                                setCreatedSecret(result.rawKey);
                                toast.success("API key rotated");
                              }
                            })
                          }
                        >
                          Rotate
                        </Button>
                      ) : null}
                      {context.permissionsFlags.canDelete ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            startTransition(async () => {
                              await revokeApiKeyAction(key.id);
                              toast.success("API key revoked");
                            })
                          }
                        >
                          Revoke
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
