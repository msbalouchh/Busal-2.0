"use client";

import type { BranchType } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugifyBranchCode } from "@/modules/branch-management/lib/branch-validation";
import type {
  BranchManagementInput,
  BranchManagementRecord,
} from "@/modules/branch-management/types/branch-management-types";
import {
  BRANCH_TYPE_OPTIONS,
  DEFAULT_BRANCH_OPENING_HOURS,
} from "@/modules/branch-management/types/branch-management-types";

interface BranchFormProps {
  initialBranch?: BranchManagementRecord | null;
  defaultCountry?: string | null;
  defaultTimezone?: string | null;
  defaultCurrency?: string | null;
  submitLabel: string;
  onSubmit: (input: BranchManagementInput) => Promise<void>;
}

function buildInitialForm(
  branch: BranchManagementRecord | null | undefined,
  defaults: { country?: string | null; timezone?: string | null; currency?: string | null },
): BranchManagementInput {
  if (branch) {
    return {
      name: branch.name,
      code: branch.code,
      type: branch.type,
      phone: branch.phone ?? "",
      email: branch.email ?? "",
      website: branch.website ?? "",
      addressLine1: branch.addressLine1 ?? "",
      addressLine2: branch.addressLine2 ?? "",
      city: branch.city ?? "",
      county: branch.county ?? "",
      postcode: branch.postcode ?? "",
      country: branch.country ?? "",
      latitude: branch.latitude,
      longitude: branch.longitude,
      timezone: branch.timezone ?? "",
      currency: branch.currency ?? "",
      taxNumber: branch.taxNumber ?? "",
      openingHours: branch.openingHours,
      isPrimary: branch.isPrimary,
      logo: branch.logo ?? "",
      coverImage: branch.coverImage ?? "",
    };
  }

  return {
    name: "",
    code: "",
    type: "OTHER",
    phone: "",
    email: "",
    website: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    county: "",
    postcode: "",
    country: defaults.country ?? "",
    latitude: null,
    longitude: null,
    timezone: defaults.timezone ?? "Europe/London",
    currency: defaults.currency ?? "GBP",
    taxNumber: "",
    openingHours: DEFAULT_BRANCH_OPENING_HOURS,
    isPrimary: false,
    logo: "",
    coverImage: "",
  };
}

export function BranchForm({
  initialBranch,
  defaultCountry,
  defaultTimezone,
  defaultCurrency,
  submitLabel,
  onSubmit,
}: BranchFormProps) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<BranchManagementInput>(() =>
    buildInitialForm(initialBranch, {
      country: defaultCountry,
      timezone: defaultTimezone,
      currency: defaultCurrency,
    }),
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      try {
        await onSubmit({
          ...form,
          code: form.code.trim() || slugifyBranchCode(form.name),
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save branch");
      }
    });
  };

  return (
    <form className="space-y-8" onSubmit={handleSubmit} aria-label="Branch form">
      <section className="space-y-4 rounded-xl border p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Basic information</h2>
          <p className="text-muted-foreground text-sm">
            Core branch identity used across all modules.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="branch-name">Branch name *</Label>
            <Input
              id="branch-name"
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch-code">Branch code *</Label>
            <Input
              id="branch-code"
              required
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
              disabled={isPending}
              aria-describedby="branch-code-help"
            />
            <p id="branch-code-help" className="text-muted-foreground text-xs">
              Unique per business. Example: LDN-01
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch-type">Branch type *</Label>
            <select
              id="branch-type"
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value as BranchType })}
              disabled={isPending}
            >
              {BRANCH_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Contact</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="branch-phone">Phone</Label>
            <Input
              id="branch-phone"
              value={form.phone ?? ""}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch-email">Email</Label>
            <Input
              id="branch-email"
              type="email"
              value={form.email ?? ""}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="branch-website">Website</Label>
            <Input
              id="branch-website"
              value={form.website ?? ""}
              onChange={(event) => setForm({ ...form, website: event.target.value })}
              disabled={isPending}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Address</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="branch-address-1">Address line 1 *</Label>
            <Input
              id="branch-address-1"
              required
              value={form.addressLine1}
              onChange={(event) => setForm({ ...form, addressLine1: event.target.value })}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="branch-address-2">Address line 2</Label>
            <Input
              id="branch-address-2"
              value={form.addressLine2 ?? ""}
              onChange={(event) => setForm({ ...form, addressLine2: event.target.value })}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch-city">City *</Label>
            <Input
              id="branch-city"
              required
              value={form.city}
              onChange={(event) => setForm({ ...form, city: event.target.value })}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch-county">County</Label>
            <Input
              id="branch-county"
              value={form.county ?? ""}
              onChange={(event) => setForm({ ...form, county: event.target.value })}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch-postcode">Postcode</Label>
            <Input
              id="branch-postcode"
              value={form.postcode ?? ""}
              onChange={(event) => setForm({ ...form, postcode: event.target.value })}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch-country">Country *</Label>
            <Input
              id="branch-country"
              required
              value={form.country}
              onChange={(event) => setForm({ ...form, country: event.target.value })}
              disabled={isPending}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Regional settings</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="branch-timezone">Timezone *</Label>
            <Input
              id="branch-timezone"
              required
              value={form.timezone}
              onChange={(event) => setForm({ ...form, timezone: event.target.value })}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch-currency">Currency</Label>
            <Input
              id="branch-currency"
              value={form.currency ?? ""}
              onChange={(event) => setForm({ ...form, currency: event.target.value })}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch-latitude">Latitude</Label>
            <Input
              id="branch-latitude"
              type="number"
              step="any"
              value={form.latitude ?? ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  latitude: event.target.value ? Number(event.target.value) : null,
                })
              }
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch-longitude">Longitude</Label>
            <Input
              id="branch-longitude"
              type="number"
              step="any"
              value={form.longitude ?? ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  longitude: event.target.value ? Number(event.target.value) : null,
                })
              }
              disabled={isPending}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="branch-tax">Tax number</Label>
            <Input
              id="branch-tax"
              value={form.taxNumber ?? ""}
              onChange={(event) => setForm({ ...form, taxNumber: event.target.value })}
              disabled={isPending}
            />
          </div>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isPrimary ?? false}
              onChange={(event) => setForm({ ...form, isPrimary: event.target.checked })}
              disabled={isPending}
              aria-label="Set as primary branch"
            />
            <span className="text-sm">Set as primary branch</span>
          </label>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
