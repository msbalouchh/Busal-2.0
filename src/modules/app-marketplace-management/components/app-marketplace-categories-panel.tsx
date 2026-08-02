"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppMarketplaceNav } from "@/modules/app-marketplace-management/components/app-marketplace-nav";
import { APP_MARKETPLACE_ROUTES } from "@/modules/app-marketplace-management/constants/routes";

interface AppMarketplaceCategoriesPanelProps {
  categories: Array<{ category: string; count: number }>;
}

export function AppMarketplaceCategoriesPanel({ categories }: AppMarketplaceCategoriesPanelProps) {
  return (
    <div className="space-y-8">
      <AppMarketplaceNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-sm">No categories yet.</p>
          ) : (
            <ul className="space-y-2">
              {categories.map((entry) => (
                <li key={entry.category} className="flex items-center justify-between text-sm">
                  <Link
                    href={`${APP_MARKETPLACE_ROUTES.store()}?category=${entry.category}`}
                    className="font-medium capitalize hover:underline"
                  >
                    {entry.category}
                  </Link>
                  <Badge variant="secondary">{entry.count}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
