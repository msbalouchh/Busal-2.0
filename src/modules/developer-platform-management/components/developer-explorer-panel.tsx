"use client";

import { useEffect, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeveloperPlatformNav } from "@/modules/developer-platform-management/components/developer-platform-nav";
import { executeExplorerAction } from "@/modules/developer-platform-management/actions/developer-platform-actions";

interface ExplorerRoute {
  method: string;
  path: string;
  scopes: string[];
  summary: string;
}

interface DeveloperExplorerPanelProps {
  routes: ExplorerRoute[];
}

export function DeveloperExplorerPanel({ routes }: DeveloperExplorerPanelProps) {
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/api/v1/orders");
  const [apiKey, setApiKey] = useState("");
  const [requestBody, setRequestBody] = useState("");
  const [result, setResult] = useState<string>("");
  const [pending, startTransition] = useTransition();

  function handleExecute(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const response = await executeExplorerAction({
          method,
          path,
          apiKey,
          body: requestBody.trim() ? requestBody : undefined,
        });
        setResult(JSON.stringify(response, null, 2));
      } catch (error) {
        setResult(
          JSON.stringify(
            { error: error instanceof Error ? error.message : "Request failed" },
            null,
            2,
          ),
        );
      }
    });
  }

  useEffect(() => {
    if (routes[0]) {
      setPath(routes[0].path);
      setMethod(routes[0].method);
    }
  }, [routes]);

  return (
    <div className="space-y-8">
      <DeveloperPlatformNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Explorer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleExecute} className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="space-y-2">
                <Label htmlFor="explorer-method">Method</Label>
                <Input
                  id="explorer-method"
                  value={method}
                  onChange={(event) => setMethod(event.target.value.toUpperCase())}
                />
              </div>
              <div className="min-w-[240px] flex-1 space-y-2">
                <Label htmlFor="explorer-path">Path</Label>
                <Input
                  id="explorer-path"
                  value={path}
                  onChange={(event) => setPath(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="explorer-api-key">API key</Label>
              <Input
                id="explorer-api-key"
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="bk_live_..."
                required
              />
              <p className="text-muted-foreground text-xs">
                Your API key is used only for this request and is never stored or displayed again.
              </p>
            </div>

            {method !== "GET" && method !== "HEAD" ? (
              <div className="space-y-2">
                <Label htmlFor="explorer-body">Request body (JSON)</Label>
                <textarea
                  id="explorer-body"
                  className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 font-mono text-xs"
                  value={requestBody}
                  onChange={(event) => setRequestBody(event.target.value)}
                />
              </div>
            ) : null}

            <Button type="submit" disabled={pending}>
              Execute request
            </Button>
          </form>

          {result ? (
            <pre className="bg-muted max-h-96 overflow-auto rounded-md p-4 text-xs">{result}</pre>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registered API v1 routes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {routes.map((route) => (
              <li
                key={`${route.method}-${route.path}`}
                className="flex flex-wrap items-start justify-between gap-2 rounded border p-3"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{route.method}</Badge>
                    <code className="text-xs">{route.path}</code>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">{route.summary}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {route.scopes.map((scope) => (
                    <Badge key={scope} variant="secondary" className="text-[10px]">
                      {scope}
                    </Badge>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
