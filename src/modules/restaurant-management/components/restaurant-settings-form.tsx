"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveRestaurantSettingsAction } from "@/modules/restaurant-management/actions/restaurant-management-actions";
import type {
  RestaurantSettingsInput,
  RestaurantSettingsRecord,
} from "@/modules/restaurant-management/types/restaurant-management-types";
import type { BranchData } from "@/services/staff-management.service";

interface RestaurantSettingsFormProps {
  settings: RestaurantSettingsRecord;
  branches: BranchData[];
  disabled?: boolean;
}

export function RestaurantSettingsForm({
  settings,
  branches,
  disabled = false,
}: RestaurantSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<RestaurantSettingsInput>({
    defaultBranchId: settings.defaultBranchId,
    businessRegistrationNumber: settings.businessRegistrationNumber ?? "",
    foodLicenseNumber: settings.foodLicenseNumber ?? "",
    vatNumber: settings.vatNumber ?? "",
    defaultCurrency: settings.defaultCurrency ?? "GBP",
    defaultTaxRate: settings.defaultTaxRate,
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      try {
        await saveRestaurantSettingsAction(form);
        toast.success("Restaurant settings saved");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save settings");
      }
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit} aria-label="Restaurant settings form">
      <section className="space-y-4 rounded-xl border p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Operational settings</h2>
          <p className="text-muted-foreground text-sm">
            Default branch, currency, and compliance registration numbers.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="restaurant-default-branch">Default branch</Label>
            <select
              id="restaurant-default-branch"
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              disabled={disabled || isPending}
              value={form.defaultBranchId ?? ""}
              onChange={(event) =>
                setForm({ ...form, defaultBranchId: event.target.value || null })
              }
            >
              <option value="">Select default branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurant-currency">Default currency</Label>
            <Input
              id="restaurant-currency"
              disabled={disabled || isPending}
              value={form.defaultCurrency ?? ""}
              onChange={(event) => setForm({ ...form, defaultCurrency: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurant-tax-rate">Default tax rate (%)</Label>
            <Input
              id="restaurant-tax-rate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              disabled={disabled || isPending}
              value={form.defaultTaxRate ?? ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  defaultTaxRate: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Compliance</h2>
          <p className="text-muted-foreground text-sm">Registration and licensing identifiers.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="restaurant-business-reg">Business registration number</Label>
            <Input
              id="restaurant-business-reg"
              disabled={disabled || isPending}
              value={form.businessRegistrationNumber ?? ""}
              onChange={(event) =>
                setForm({ ...form, businessRegistrationNumber: event.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurant-food-license">Food license number</Label>
            <Input
              id="restaurant-food-license"
              disabled={disabled || isPending}
              value={form.foodLicenseNumber ?? ""}
              onChange={(event) => setForm({ ...form, foodLicenseNumber: event.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="restaurant-vat">VAT number</Label>
            <Input
              id="restaurant-vat"
              disabled={disabled || isPending}
              value={form.vatNumber ?? ""}
              onChange={(event) => setForm({ ...form, vatNumber: event.target.value })}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={disabled || isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save settings
        </Button>
      </div>
    </form>
  );
}
