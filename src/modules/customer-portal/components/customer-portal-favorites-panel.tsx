"use client";

import { Heart } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { CustomerFavoriteList } from "@/modules/customer-portal/types/customer-portal";

interface CustomerPortalFavoritesPanelProps {
  favorites: CustomerFavoriteList;
}

export function CustomerPortalFavoritesPanel({ favorites }: CustomerPortalFavoritesPanelProps) {
  if (favorites.length === 0) {
    return (
      <EmptyState
        title="No favorites yet"
        description="Items you order frequently will appear here."
        icon={<Heart className="text-muted-foreground h-6 w-6" />}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {favorites.map((item) => (
        <Card key={item.productId}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{item.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-semibold">{item.priceFormatted}</p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline">{item.orderCount} orders</Badge>
              <Badge variant="secondary">{item.totalQuantity} items</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
