"use client";

import { CreditCard } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPortalDate } from "@/modules/customer-portal/components/customer-portal-format";

import type { CustomerGiftCardList } from "@/modules/customer-portal/types/customer-portal";

interface CustomerPortalGiftCardsPanelProps {
  giftCards: CustomerGiftCardList;
}

export function CustomerPortalGiftCardsPanel({ giftCards }: CustomerPortalGiftCardsPanelProps) {
  if (giftCards.length === 0) {
    return (
      <EmptyState
        title="No gift cards"
        description="Redeemed voucher rewards will appear here."
        icon={<CreditCard className="text-muted-foreground h-6 w-6" />}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {giftCards.map((card) => (
        <Card key={card.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{card.name}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {card.valueFormatted ? (
              <p className="text-lg font-semibold">{card.valueFormatted}</p>
            ) : null}
            <p className="text-muted-foreground text-xs">
              Redeemed {formatPortalDate(card.redeemedAt)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
