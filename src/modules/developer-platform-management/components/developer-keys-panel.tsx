"use client";

import { useState, useTransition } from "react";

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

interface DeveloperKeysPanelProps {
  context: DeveloperPlatformContext;
  keys: ApiKeyRecord[];
  applications: ApiApplicationRecord[];
}

export function DeveloperKeysPanel({ context, keys, applications }: DeveloperKeysPanelProps) {
  const [name, setName] = useState("");
  const [applicationId, setApplicationId] = useState(applications[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!applicationId) return;
    startTransition(async () => {
      await createApiKeyAction({ applicationId, name });
      setName("");
    });
  }

  return (
    <div className="space-y-8">
      <DeveloperPlatformNav />

      {context.permissionsFlags.canCreate && applications.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create API key</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
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
              <Button type="submit" disabled={pending} className="sm:col-span-2 sm:w-fit">
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
                <li
                  key={key.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{key.name}</p>
                    <p className="text-muted-foreground text-xs">{key.applicationName}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{key.status}</Badge>
                    {context.permissionsFlags.canManage ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => rotateApiKeyAction(key.id)}
                      >
                        Rotate
                      </Button>
                    ) : null}
                    {context.permissionsFlags.canDelete ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => revokeApiKeyAction(key.id)}
                      >
                        Revoke
                      </Button>
                    ) : null}
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
