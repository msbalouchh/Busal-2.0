"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveRestaurantPreferencesAction } from "@/modules/restaurant-management/actions/restaurant-management-actions";
import { RESTAURANT_SERVICE_MODES } from "@/modules/restaurant-management/constants/routes";
import type {
  RestaurantPreferencesInput,
  RestaurantSettingsRecord,
} from "@/modules/restaurant-management/types/restaurant-management-types";

interface RestaurantPreferencesFormProps {
  settings: RestaurantSettingsRecord;
  disabled?: boolean;
}

export function RestaurantPreferencesForm({
  settings,
  disabled = false,
}: RestaurantPreferencesFormProps) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<RestaurantPreferencesInput>({
    allowDineIn: settings.allowDineIn,
    allowTakeaway: settings.allowTakeaway,
    allowDelivery: settings.allowDelivery,
    allowReservations: settings.allowReservations,
    reservationIntervalMinutes: settings.reservationIntervalMinutes,
    reservationBufferMinutes: settings.reservationBufferMinutes,
    serviceChargeEnabled: settings.serviceChargeEnabled,
    serviceChargePercentage: settings.serviceChargePercentage,
  });

  const toggleMode = (
    key: keyof Pick<
      RestaurantPreferencesInput,
      "allowDineIn" | "allowTakeaway" | "allowDelivery" | "allowReservations"
    >,
  ) => {
    setForm((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      try {
        await saveRestaurantPreferencesAction(form);
        toast.success("Restaurant preferences saved");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save preferences");
      }
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit} aria-label="Restaurant preferences form">
      <section className="space-y-4 rounded-xl border p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Service modes</h2>
          <p className="text-muted-foreground text-sm">
            Choose how guests can interact with your restaurant.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {RESTAURANT_SERVICE_MODES.map((mode) => (
            <label
              key={mode.key}
              className="flex cursor-pointer items-start gap-3 rounded-lg border p-4"
            >
              <input
                type="checkbox"
                disabled={disabled || isPending}
                checked={Boolean(form[mode.key])}
                onChange={() => toggleMode(mode.key)}
                className="mt-1"
              />
              <span>
                <span className="block font-medium">{mode.label}</span>
                <span className="text-muted-foreground block text-sm">{mode.description}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Reservations</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="reservation-interval">Interval (minutes)</Label>
            <Input
              id="reservation-interval"
              type="number"
              min="5"
              step="5"
              disabled={disabled || isPending}
              value={form.reservationIntervalMinutes ?? 30}
              onChange={(event) =>
                setForm({ ...form, reservationIntervalMinutes: Number(event.target.value) })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reservation-buffer">Buffer (minutes)</Label>
            <Input
              id="reservation-buffer"
              type="number"
              min="0"
              step="5"
              disabled={disabled || isPending}
              value={form.reservationBufferMinutes ?? 15}
              onChange={(event) =>
                setForm({ ...form, reservationBufferMinutes: Number(event.target.value) })
              }
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Service charge</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={disabled || isPending}
              checked={form.serviceChargeEnabled ?? false}
              onChange={(event) => setForm({ ...form, serviceChargeEnabled: event.target.checked })}
            />
            Enable service charge
          </label>
          <div className="space-y-2">
            <Label htmlFor="service-charge-percent">Service charge (%)</Label>
            <Input
              id="service-charge-percent"
              type="number"
              min="0"
              max="100"
              step="0.5"
              disabled={disabled || isPending || !form.serviceChargeEnabled}
              value={form.serviceChargePercentage ?? ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  serviceChargePercentage: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={disabled || isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save preferences
        </Button>
      </div>
    </form>
  );
}
