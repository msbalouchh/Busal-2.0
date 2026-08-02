"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, UtensilsCrossed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";
import type { RestaurantFoundationBundle } from "@/modules/restaurant-management/types/restaurant-management-types";

interface RestaurantStatusCardProps {
  bundle: RestaurantFoundationBundle;
}

export function RestaurantStatusCard({ bundle }: RestaurantStatusCardProps) {
  const enabledFeatures = [
    bundle.settings.kitchenDisplayEnabled && "Kitchen Display",
    bundle.settings.qrOrderingEnabled && "QR Ordering",
    bundle.settings.posEnabled && "POS",
    bundle.settings.loyaltyEnabled && "Loyalty",
    bundle.settings.onlineOrderingEnabled && "Online Ordering",
  ].filter(Boolean) as string[];

  const serviceModes = [
    bundle.settings.allowDineIn && "Dine-in",
    bundle.settings.allowTakeaway && "Takeaway",
    bundle.settings.allowDelivery && "Delivery",
    bundle.settings.allowReservations && "Reservations",
  ].filter(Boolean) as string[];

  return (
    <Card className="rounded-xl shadow-sm" aria-label="Restaurant module status">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-11 w-11 items-center justify-center rounded-full">
              <UtensilsCrossed className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-lg">Restaurant Module</CardTitle>
              <CardDescription>Foundation configuration for hospitality operations</CardDescription>
            </div>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
              bundle.moduleEnabled
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300",
            )}
          >
            {bundle.moduleEnabled ? (
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {bundle.moduleEnabled ? "Enabled" : "Not enabled"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!bundle.moduleEnabled ? (
          <div className="rounded-lg border border-dashed p-4 text-sm">
            <p className="text-muted-foreground mb-3">
              Enable the Restaurant module to activate menus, POS, reservations, and kitchen
              workflows.
            </p>
            <Button asChild size="sm">
              <Link href="/app/modules/restaurant">Enable Restaurant module</Link>
            </Button>
          </div>
        ) : (
          <>
            <div>
              <p className="mb-1 text-sm font-medium">Active features</p>
              <p className="text-muted-foreground text-sm">
                {enabledFeatures.length > 0
                  ? enabledFeatures.join(" · ")
                  : "No features enabled yet"}
              </p>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium">Service modes</p>
              <p className="text-muted-foreground text-sm">
                {serviceModes.length > 0 ? serviceModes.join(" · ") : "No service modes configured"}
              </p>
            </div>
          </>
        )}
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={RESTAURANT_MANAGEMENT_ROUTES.settings}>Settings</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={RESTAURANT_MANAGEMENT_ROUTES.branding}>Branding</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href={RESTAURANT_MANAGEMENT_ROUTES.preferences}>Preferences</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
