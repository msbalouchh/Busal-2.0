"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeveloperPlatformNav } from "@/modules/developer-platform-management/components/developer-platform-nav";
import { simulateExplorerAction } from "@/modules/developer-platform-management/actions/developer-platform-actions";
import type { ApiRouteDefinition } from "@/services/api-version-manager.service";

interface DeveloperExplorerPanelProps {
  routes: ApiRouteDefinition[];
}

export function DeveloperExplorerPanel({ routes }: DeveloperExplorerPanelProps) {
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/api/v1/orders");
  const [result, setResult] = useState<string>("");
  const [pending, startTransition] = useTransition();

  function handleSimulate(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const response = await simulateExplorerAction({ method, path });
      setResult(JSON.stringify(response, null, 2));
    });
  }

  return (
    <div className="space-y-8">
      <DeveloperPlatformNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Explorer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSimulate} className="flex flex-wrap gap-3">
            <div className="space-y-2">
              <Label htmlFor="explorer-method">Method</Label>
              <Input
                id="explorer-method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              />
            </div>
            <div className="min-w-[240px] flex-1 space-y-2">
              <Label htmlFor="explorer-path">Path</Label>
              <Input id="explorer-path" value={path} onChange={(e) => setPath(e.target.value)} />
            </div>
            <Button type="submit" disabled={pending} className="self-end">
              Simulate
            </Button>
          </form>
          {result ? (
            <pre className="bg-muted max-h-48 overflow-auto rounded-md p-4 text-xs">{result}</pre>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Route catalog (sample)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {routes.map((route) => (
              <li
                key={`${route.method}-${route.path}`}
                className="flex items-center justify-between"
              >
                <span>
                  <Badge variant="outline" className="mr-2">
                    {route.method}
                  </Badge>
                  {route.path}
                </span>
                <span className="text-muted-foreground text-xs">{route.module}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
