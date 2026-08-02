"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { saveBusinessSettingsAction } from "@/modules/business/actions/business-profile-actions";
import { BUSINESS_PROFILE_ROUTES } from "@/modules/business/constants/business-profile";
import { BusinessFormStatus } from "@/modules/business/components/business-form-status";
import {
  BUSINESS_STATUS_OPTIONS,
  WEEK_START_OPTIONS,
} from "@/modules/business/constants/business-profile";
import { useUnsavedChanges } from "@/modules/business/hooks/use-unsaved-changes";
import type { SerializedBusinessProfile } from "@/modules/business/types/business-profile-types";
import { cn } from "@/lib/utils";

interface BusinessSettingsPanelProps {
  profile: SerializedBusinessProfile;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function BusinessSettingsPanel({ profile }: BusinessSettingsPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [form, setForm] = useState({
    weekStart: profile.regional.weekStart,
    businessStatus: profile.operational.businessStatus,
    autoConfirmOrders: profile.operational.autoConfirmOrders,
    allowOnlineOrdering: profile.operational.allowOnlineOrdering,
    requireStaffPin: profile.operational.requireStaffPin,
  });

  const initialSnapshot = useMemo(
    () =>
      JSON.stringify({
        weekStart: profile.regional.weekStart,
        businessStatus: profile.operational.businessStatus,
        autoConfirmOrders: profile.operational.autoConfirmOrders,
        allowOnlineOrdering: profile.operational.allowOnlineOrdering,
        requireStaffPin: profile.operational.requireStaffPin,
      }),
    [profile],
  );
  const isDirty = JSON.stringify(form) !== initialSnapshot;
  useUnsavedChanges(isDirty && !isPending);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profile.canManageSettings) {
      toast.error("You do not have permission to manage business settings.");
      return;
    }

    startTransition(async () => {
      setSaveState("saving");

      try {
        await saveBusinessSettingsAction(form);
        setSaveState("saved");
        toast.success("Business settings saved");
      } catch (error) {
        setSaveState("error");
        toast.error(error instanceof Error ? error.message : "Unable to save business settings");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      <section className="space-y-4" aria-labelledby="general-settings-heading">
        <h2 id="general-settings-heading" className="text-lg font-semibold">
          General
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="weekStart">Week start</Label>
            <select
              id="weekStart"
              value={form.weekStart}
              disabled={isPending || !profile.canManageSettings}
              className={cn(
                "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
              )}
              onChange={(event) =>
                setForm((current) => ({ ...current, weekStart: event.target.value }))
              }
            >
              {WEEK_START_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessStatus">Business status</Label>
            <select
              id="businessStatus"
              value={form.businessStatus}
              disabled={isPending || !profile.canManageSettings}
              className={cn(
                "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
              )}
              onChange={(event) =>
                setForm((current) => ({ ...current, businessStatus: event.target.value }))
              }
            >
              {BUSINESS_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="operational-preferences-heading">
        <h2 id="operational-preferences-heading" className="text-lg font-semibold">
          Operational preferences
        </h2>
        <div className="space-y-3">
          {[
            {
              key: "autoConfirmOrders" as const,
              label: "Automatically confirm incoming orders",
            },
            {
              key: "allowOnlineOrdering" as const,
              label: "Allow online ordering",
            },
            {
              key: "requireStaffPin" as const,
              label: "Require staff PIN for sensitive actions",
            },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form[item.key]}
                disabled={isPending || !profile.canManageSettings}
                onChange={(event) =>
                  setForm((current) => ({ ...current, [item.key]: event.target.checked }))
                }
              />
              {item.label}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="related-settings-heading">
        <h2 id="related-settings-heading" className="text-lg font-semibold">
          Related settings
        </h2>
        <p className="text-muted-foreground text-sm">
          Manage working hours and regional formatting from dedicated pages.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" type="button">
            <Link href={BUSINESS_PROFILE_ROUTES.hours}>Working hours</Link>
          </Button>
          <Button asChild variant="outline" type="button">
            <Link href={BUSINESS_PROFILE_ROUTES.profile}>Regional settings</Link>
          </Button>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BusinessFormStatus state={saveState} />
        <Button type="submit" disabled={isPending || !profile.canManageSettings || !isDirty}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save settings
        </Button>
      </div>
    </form>
  );
}
