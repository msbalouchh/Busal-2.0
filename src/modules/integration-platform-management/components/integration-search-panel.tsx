"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IntegrationPlatformNav } from "@/modules/integration-platform-management/components/integration-platform-nav";
import { INTEGRATION_PLATFORM_ROUTES } from "@/modules/integration-platform-management/constants/routes";
import type {
  IntegrationConnectionRecord,
  IntegrationLogRecord,
  IntegrationProviderRecord,
} from "@/modules/integration-platform-management/types/integration-platform-types";

interface IntegrationSearchPanelProps {
  search: string;
  results: {
    providers: IntegrationProviderRecord[];
    connections: IntegrationConnectionRecord[];
    logs: IntegrationLogRecord[];
  };
}

export function IntegrationSearchPanel({ search, results }: IntegrationSearchPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState(search);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <IntegrationPlatformNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(() => {
                const params = new URLSearchParams();
                if (query.trim()) params.set("q", query.trim());
                router.push(`${INTEGRATION_PLATFORM_ROUTES.search()}?${params.toString()}`);
              });
            }}
          >
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search providers, connections, logs…"
              className="max-w-md"
              aria-label="Search integrations"
            />
            <Button type="submit" disabled={isPending}>
              Search
            </Button>
          </form>

          {search ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <div>
                <p className="mb-2 text-sm font-medium">Providers ({results.providers.length})</p>
                <ul className="space-y-2">
                  {results.providers.map((item) => (
                    <li key={item.id} className="rounded border p-2 text-sm">
                      {item.name}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">
                  Connections ({results.connections.length})
                </p>
                <ul className="space-y-2">
                  {results.connections.map((item) => (
                    <li key={item.id} className="rounded border p-2 text-sm">
                      {item.displayName}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Logs ({results.logs.length})</p>
                <ul className="space-y-2">
                  {results.logs.map((item) => (
                    <li key={item.id} className="rounded border p-2 text-sm">
                      {item.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Enter a search term.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
