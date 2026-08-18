"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlatformApiDocsProps {
  routes: Array<{ method: string; path: string }>;
  scopes: string[];
}

export function PlatformApiDocs({ routes, scopes }: PlatformApiDocsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>All requests require a Bearer API key in the Authorization header.</p>
          <pre className="bg-muted overflow-x-auto rounded-lg p-3 text-xs">
            {`Authorization: Bearer bk_your_api_key`}
          </pre>
          <p className="text-muted-foreground">
            Keys are created in Developer → API Keys. The full secret is shown only once at creation.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scopes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {scopes.map((scope) => (
              <Badge key={scope} variant="secondary">
                {scope}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rate limits</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>Tenant-level and API-key limits apply per minute.</p>
          <p>Responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` on 429.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {routes.map((route) => (
              <li key={`${route.method}-${route.path}`} className="flex items-center gap-3 rounded border p-3">
                <Badge>{route.method}</Badge>
                <code>{route.path}</code>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Webhooks</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>Webhook payloads are signed with HMAC SHA-256 in the `X-Busal-Signature` header.</p>
          <p>Supported events include order, customer, reservation, payment, subscription, and business events.</p>
        </CardContent>
      </Card>
    </div>
  );
}
