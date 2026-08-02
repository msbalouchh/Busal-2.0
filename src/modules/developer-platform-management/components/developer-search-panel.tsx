"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeveloperPlatformNav } from "@/modules/developer-platform-management/components/developer-platform-nav";
import { DEVELOPER_PLATFORM_ROUTES } from "@/modules/developer-platform-management/constants/routes";
import type {
  ApiApplicationRecord,
  ApiRequestLogRecord,
  WebhookSubscriptionRecord,
} from "@/modules/developer-platform-management/types/developer-platform-types";

interface DeveloperSearchPanelProps {
  search: string;
  results: {
    applications: ApiApplicationRecord[];
    webhooks: WebhookSubscriptionRecord[];
    logs: ApiRequestLogRecord[];
  };
}

export function DeveloperSearchPanel({ search, results }: DeveloperSearchPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState(search);

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`${DEVELOPER_PLATFORM_ROUTES.search()}?${params.toString()}`);
  }

  return (
    <div className="space-y-8">
      <DeveloperPlatformNav />

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search applications, webhooks, logs..."
        />
        <Button type="submit">Search</Button>
      </form>

      {search ? (
        <p className="text-muted-foreground text-sm">Results for &quot;{search}&quot;</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {results.applications.length === 0 ? (
              <p className="text-muted-foreground text-sm">None found.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {results.applications.map((app) => (
                  <li key={app.id} className="flex justify-between">
                    <span>{app.name}</span>
                    <Badge variant="secondary">{app.clientId.slice(0, 12)}…</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Webhooks</CardTitle>
          </CardHeader>
          <CardContent>
            {results.webhooks.length === 0 ? (
              <p className="text-muted-foreground text-sm">None found.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {results.webhooks.map((webhook) => (
                  <li key={webhook.id}>{webhook.event}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {results.logs.length === 0 ? (
              <p className="text-muted-foreground text-sm">None found.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {results.logs.map((log) => (
                  <li key={log.id}>
                    {log.method} {log.path}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
