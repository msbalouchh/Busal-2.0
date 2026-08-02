"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppMarketplaceNav } from "@/modules/app-marketplace-management/components/app-marketplace-nav";
import type { AppReviewRecord } from "@/modules/app-marketplace-management/types/app-marketplace-types";

interface AppMarketplaceReviewsPanelProps {
  reviews: AppReviewRecord[];
}

export function AppMarketplaceReviewsPanel({ reviews }: AppMarketplaceReviewsPanelProps) {
  return (
    <div className="space-y-8">
      <AppMarketplaceNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">No reviews submitted yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {reviews.map((review) => (
                <li key={review.id} className="rounded border p-3">
                  <p className="font-medium">{review.appName ?? "App"}</p>
                  <p>{"★".repeat(review.rating)}</p>
                  <p className="text-muted-foreground">{review.review || "No comment"}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
