"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { saveRestaurantFeatureTogglesAction } from "@/modules/restaurant-management/actions/restaurant-management-actions";
import { RESTAURANT_FEATURE_TOGGLES } from "@/modules/restaurant-management/constants/routes";
import type { RestaurantSettingsRecord } from "@/modules/restaurant-management/types/restaurant-management-types";

interface RestaurantFeatureToggleCardsProps {
  settings: RestaurantSettingsRecord;
  disabled?: boolean;
}

export function RestaurantFeatureToggleCards({
  settings,
  disabled = false,
}: RestaurantFeatureToggleCardsProps) {
  const [isPending, startTransition] = useTransition();
  const [toggles, setToggles] = useState({
    kitchenDisplayEnabled: settings.kitchenDisplayEnabled,
    qrOrderingEnabled: settings.qrOrderingEnabled,
    posEnabled: settings.posEnabled,
    loyaltyEnabled: settings.loyaltyEnabled,
    onlineOrderingEnabled: settings.onlineOrderingEnabled,
  });

  const handleToggle = (key: keyof typeof toggles) => {
    const next = { ...toggles, [key]: !toggles[key] };
    setToggles(next);

    startTransition(async () => {
      try {
        await saveRestaurantFeatureTogglesAction(next);
        toast.success("Feature updated");
      } catch (error) {
        setToggles(toggles);
        toast.error(error instanceof Error ? error.message : "Unable to update feature");
      }
    });
  };

  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-label="Restaurant feature toggles"
    >
      {RESTAURANT_FEATURE_TOGGLES.map((feature) => {
        const enabled = toggles[feature.key];
        return (
          <Card key={feature.key} className="rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{feature.label}</CardTitle>
                  <CardDescription className="mt-1">{feature.description}</CardDescription>
                </div>
                {isPending ? (
                  <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={`Toggle ${feature.label}`}
                disabled={disabled || isPending}
                onClick={() => handleToggle(feature.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                  enabled ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
