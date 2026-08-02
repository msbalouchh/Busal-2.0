"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveBusinessProfileAction } from "@/modules/business/actions/business-profile-actions";
import { BusinessFormStatus } from "@/modules/business/components/business-form-status";
import {
  CURRENCY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  INDUSTRY_OPTIONS,
  LANGUAGE_OPTIONS,
  TIME_FORMAT_OPTIONS,
  TIMEZONE_OPTIONS,
} from "@/modules/business/constants/business-profile";
import { useUnsavedChanges } from "@/modules/business/hooks/use-unsaved-changes";
import type { SerializedBusinessProfile } from "@/modules/business/types/business-profile-types";
import { BUSINESS_TYPE_OPTIONS } from "@/modules/onboarding/lib/business-interview-questions";
import { cn } from "@/lib/utils";

interface BusinessProfileFormProps {
  profile: SerializedBusinessProfile;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function BusinessProfileForm({ profile }: BusinessProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [form, setForm] = useState({
    businessName: profile.businessName,
    legalName: profile.legalName,
    businessType: profile.businessType ?? "OTHER",
    industry: profile.industry || "OTHER",
    description: profile.description,
    ownerName: profile.ownerName ?? "",
    timezone: profile.regional.timezone,
    currency: profile.regional.currency,
    language: profile.regional.language,
    dateFormat: profile.regional.dateFormat,
    timeFormat: profile.regional.timeFormat,
  });

  const initialSnapshot = useMemo(
    () =>
      JSON.stringify({
        businessName: profile.businessName,
        legalName: profile.legalName,
        businessType: profile.businessType ?? "OTHER",
        industry: profile.industry || "OTHER",
        description: profile.description,
        ownerName: profile.ownerName ?? "",
        timezone: profile.regional.timezone,
        currency: profile.regional.currency,
        language: profile.regional.language,
        dateFormat: profile.regional.dateFormat,
        timeFormat: profile.regional.timeFormat,
      }),
    [profile],
  );
  const isDirty = JSON.stringify(form) !== initialSnapshot;
  useUnsavedChanges(isDirty && !isPending);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaveState("idle");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profile.canEdit) {
      toast.error("You do not have permission to edit the business profile.");
      return;
    }

    startTransition(async () => {
      setSaveState("saving");

      try {
        await saveBusinessProfileAction({
          businessName: form.businessName,
          legalName: form.legalName,
          businessType: form.businessType as (typeof BUSINESS_TYPE_OPTIONS)[number]["value"],
          industry: form.industry,
          description: form.description,
          ownerName: form.ownerName,
          timezone: form.timezone,
          currency: form.currency,
          language: form.language,
          dateFormat: form.dateFormat,
          timeFormat: form.timeFormat,
        });
        setSaveState("saved");
        toast.success("Business profile saved");
      } catch (error) {
        setSaveState("error");
        toast.error(error instanceof Error ? error.message : "Unable to save business profile");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      <section className="space-y-4" aria-labelledby="business-identity-heading">
        <h2 id="business-identity-heading" className="text-lg font-semibold">
          Business identity
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="businessName">Business name</Label>
            <Input
              id="businessName"
              value={form.businessName}
              disabled={isPending || !profile.canEdit}
              required
              onChange={(event) => updateField("businessName", event.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="legalName">Legal name</Label>
            <Input
              id="legalName"
              value={form.legalName}
              disabled={isPending || !profile.canEdit}
              onChange={(event) => updateField("legalName", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessId">Business ID</Label>
            <Input id="businessId" value={profile.id} readOnly disabled aria-readonly="true" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessType">Business type</Label>
            <select
              id="businessType"
              value={form.businessType}
              disabled={isPending || !profile.canEdit}
              className={cn(
                "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
              )}
              onChange={(event) => updateField("businessType", event.target.value)}
            >
              {BUSINESS_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <select
              id="industry"
              value={form.industry}
              disabled={isPending || !profile.canEdit}
              className={cn(
                "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
              )}
              onChange={(event) => updateField("industry", event.target.value)}
            >
              {INDUSTRY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={form.description}
              disabled={isPending || !profile.canEdit}
              rows={4}
              className={cn(
                "border-input bg-background flex w-full rounded-md border px-3 py-2 text-sm shadow-sm",
              )}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ownerName">Owner name</Label>
            <Input
              id="ownerName"
              value={form.ownerName}
              disabled={isPending || !profile.canEdit}
              onChange={(event) => updateField("ownerName", event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="regional-settings-heading">
        <h2 id="regional-settings-heading" className="text-lg font-semibold">
          Regional settings
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { id: "timezone", label: "Timezone", options: TIMEZONE_OPTIONS },
            { id: "currency", label: "Currency", options: CURRENCY_OPTIONS },
            { id: "language", label: "Language", options: LANGUAGE_OPTIONS },
            { id: "dateFormat", label: "Date format", options: DATE_FORMAT_OPTIONS },
            { id: "timeFormat", label: "Time format", options: TIME_FORMAT_OPTIONS },
          ].map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              <select
                id={field.id}
                value={form[field.id as keyof typeof form]}
                disabled={isPending || !profile.canEdit}
                className={cn(
                  "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
                )}
                onChange={(event) => updateField(field.id as keyof typeof form, event.target.value)}
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BusinessFormStatus state={saveState} />
        <Button type="submit" disabled={isPending || !profile.canEdit || !isDirty}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save profile
        </Button>
      </div>
    </form>
  );
}
