"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppMarketplaceNav } from "@/modules/app-marketplace-management/components/app-marketplace-nav";
import { APP_MARKETPLACE_ROUTES } from "@/modules/app-marketplace-management/constants/routes";
import type { MarketplaceAppRecord } from "@/modules/app-marketplace-management/types/app-marketplace-types";

interface AppMarketplaceSearchPanelProps {
  search: string;
  apps: MarketplaceAppRecord[];
}

export function AppMarketplaceSearchPanel({ search, apps }: AppMarketplaceSearchPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState(search);

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`${APP_MARKETPLACE_ROUTES.search()}?${params.toString()}`);
  }

  return (
    <div className="space-y-8">
      <AppMarketplaceNav />

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search apps..."
        />
        <Button type="submit">Search</Button>
      </form>

      {search ? (
        <p className="text-muted-foreground text-sm">Results for &quot;{search}&quot;</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apps</CardTitle>
        </CardHeader>
        <CardContent>
          {apps.length === 0 ? (
            <p className="text-muted-foreground text-sm">No apps found.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {apps.map((app) => (
                <li key={app.id} className="flex items-center justify-between">
                  <Link
                    href={APP_MARKETPLACE_ROUTES.appDetail(app.id)}
                    className="font-medium hover:underline"
                  >
                    {app.name}
                  </Link>
                  <Badge variant="secondary">{app.category}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
