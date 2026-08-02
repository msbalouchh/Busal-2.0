"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppMarketplaceNav } from "@/modules/app-marketplace-management/components/app-marketplace-nav";
import {
  createAppReviewAction,
  installAppAction,
} from "@/modules/app-marketplace-management/actions/app-marketplace-actions";
import type { AppMarketplaceContext } from "@/modules/app-marketplace-management/lib/get-app-marketplace-context";
import type {
  AppReviewRecord,
  MarketplaceAppRecord,
} from "@/modules/app-marketplace-management/types/app-marketplace-types";

interface AppMarketplaceDetailPanelProps {
  context: AppMarketplaceContext;
  app: MarketplaceAppRecord;
  reviews: AppReviewRecord[];
}

export function AppMarketplaceDetailPanel({
  context,
  app,
  reviews,
}: AppMarketplaceDetailPanelProps) {
  const [rating, setRating] = useState("5");
  const [review, setReview] = useState("");
  const [pending, startTransition] = useTransition();

  function handleReview(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      await createAppReviewAction({ appId: app.id, rating: Number(rating), review });
      setReview("");
    });
  }

  return (
    <div className="space-y-8">
      <AppMarketplaceNav />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{app.name}</CardTitle>
            <p className="text-muted-foreground text-sm">{app.description || "No description."}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">{app.category}</Badge>
            <Badge variant="outline">v{app.currentVersion}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Developer: {app.developer} · Pricing: {app.pricingModel}
          </p>
          {context.permissionsFlags.canInstall ? (
            <Button type="button" onClick={() => installAppAction(app.id)}>
              Install app
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">No reviews yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {reviews.map((entry) => (
                <li key={entry.id}>
                  {"★".repeat(entry.rating)} — {entry.review || "No comment"}
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleReview} className="grid max-w-md gap-3">
            <div className="space-y-2">
              <Label htmlFor="rating">Rating</Label>
              <Input
                id="rating"
                type="number"
                min={1}
                max={5}
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="review">Review</Label>
              <Input id="review" value={review} onChange={(e) => setReview(e.target.value)} />
            </div>
            <Button type="submit" disabled={pending} className="w-fit">
              Submit review
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
