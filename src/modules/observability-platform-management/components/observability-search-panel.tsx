"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ObservabilityPlatformNav } from "@/modules/observability-platform-management/components/observability-platform-nav";
import { OBSERVABILITY_PLATFORM_ROUTES } from "@/modules/observability-platform-management/constants/routes";
import type {
  LogRecord,
  MetricRecord,
} from "@/modules/observability-platform-management/types/observability-platform-types";

interface ObservabilitySearchPanelProps {
  search: string;
  logs: LogRecord[];
  metrics: MetricRecord[];
}

export function ObservabilitySearchPanel({ search, logs, metrics }: ObservabilitySearchPanelProps) {
  const router = useRouter();

  return (
    <div className="space-y-8">
      <ObservabilityPlatformNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search observability data</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const query = String(formData.get("q") ?? "").trim();
              router.push(
                query
                  ? `${OBSERVABILITY_PLATFORM_ROUTES.search()}?q=${encodeURIComponent(query)}`
                  : OBSERVABILITY_PLATFORM_ROUTES.search(),
              );
            }}
          >
            <Input name="q" defaultValue={search} placeholder="Search logs and metrics..." />
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {search && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Logs ({logs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No matching logs.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {logs.slice(0, 10).map((log) => (
                    <li key={log.id}>
                      <Badge variant="outline" className="mr-2">
                        {log.level}
                      </Badge>
                      {log.message}
                    </li>
                  ))}
                </ul>
              )}
              {logs.length > 0 && (
                <Link
                  href={`${OBSERVABILITY_PLATFORM_ROUTES.logs()}?search=${encodeURIComponent(search)}`}
                  className="text-primary mt-3 inline-block text-sm hover:underline"
                >
                  View all logs
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metrics ({metrics.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.length === 0 ? (
                <p className="text-muted-foreground text-sm">No matching metrics.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {metrics.slice(0, 10).map((metric) => (
                    <li key={metric.id}>
                      {metric.service} / {metric.metric}: {metric.value}
                      {metric.unit ? ` ${metric.unit}` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
