"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeveloperPlatformNav } from "@/modules/developer-platform-management/components/developer-platform-nav";
import {
  createApiApplicationAction,
  deleteApiApplicationAction,
} from "@/modules/developer-platform-management/actions/developer-platform-actions";
import type { DeveloperPlatformContext } from "@/modules/developer-platform-management/lib/get-developer-platform-context";
import type { ApiApplicationRecord } from "@/modules/developer-platform-management/types/developer-platform-types";

interface DeveloperApplicationsPanelProps {
  context: DeveloperPlatformContext;
  applications: ApiApplicationRecord[];
}

export function DeveloperApplicationsPanel({
  context,
  applications,
}: DeveloperApplicationsPanelProps) {
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      await createApiApplicationAction({ name });
      setName("");
    });
  }

  return (
    <div className="space-y-8">
      <DeveloperPlatformNav />

      {context.permissionsFlags.canCreate ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create application</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-wrap gap-3">
              <div className="min-w-[200px] flex-1 space-y-2">
                <Label htmlFor="app-name">Name</Label>
                <Input
                  id="app-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={pending} className="self-end">
                Create
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-muted-foreground text-sm">No API applications yet.</p>
          ) : (
            <ul className="space-y-3">
              {applications.map((app) => (
                <li
                  key={app.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{app.name}</p>
                    <p className="text-muted-foreground text-xs">{app.clientId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{app.status}</Badge>
                    {context.permissionsFlags.canDelete ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteApiApplicationAction(app.id)}
                      >
                        Delete
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
