"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { QrMenuProduct } from "@/modules/qr-ordering-management/types/qr-ordering-types";

interface QrProductCardProps {
  product: QrMenuProduct;
  onSelect: (product: QrMenuProduct) => void;
}

export function QrProductCard({ product, onSelect }: QrProductCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex gap-3 p-3">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="h-20 w-20 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="bg-muted flex h-20 w-20 shrink-0 items-center justify-center rounded-lg text-xs">
            No image
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium">{product.name}</h3>
              {product.shortDescription ? (
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  {product.shortDescription}
                </p>
              ) : null}
            </div>
            <p className="shrink-0 font-semibold">${product.price.toFixed(2)}</p>
          </div>
          <Button type="button" size="sm" className="mt-2" onClick={() => onSelect(product)}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
