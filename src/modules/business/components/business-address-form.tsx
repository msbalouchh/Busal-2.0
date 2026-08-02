"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveBusinessAddressAction } from "@/modules/business/actions/business-profile-actions";
import { BusinessFormStatus } from "@/modules/business/components/business-form-status";
import { useUnsavedChanges } from "@/modules/business/hooks/use-unsaved-changes";
import type { SerializedBusinessProfile } from "@/modules/business/types/business-profile-types";
import { cn } from "@/lib/utils";

interface BusinessAddressFormProps {
  profile: SerializedBusinessProfile;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function BusinessAddressForm({ profile }: BusinessAddressFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [form, setForm] = useState(profile.address);

  const initialSnapshot = useMemo(() => JSON.stringify(profile.address), [profile]);
  const isDirty = JSON.stringify(form) !== initialSnapshot;
  useUnsavedChanges(isDirty && !isPending);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaveState("idle");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profile.canEdit) {
      toast.error("You do not have permission to edit the business address.");
      return;
    }

    startTransition(async () => {
      setSaveState("saving");

      try {
        await saveBusinessAddressAction(form);
        setSaveState("saved");
        toast.success("Business address saved");
      } catch (error) {
        setSaveState("error");
        toast.error(error instanceof Error ? error.message : "Unable to save business address");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={form.country}
            required
            disabled={isPending || !profile.canEdit}
            onChange={(event) => updateField("country", event.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="addressLine1">Address line 1</Label>
          <Input
            id="addressLine1"
            value={form.addressLine1}
            required
            disabled={isPending || !profile.canEdit}
            onChange={(event) => updateField("addressLine1", event.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="addressLine2">Address line 2</Label>
          <Input
            id="addressLine2"
            value={form.addressLine2}
            disabled={isPending || !profile.canEdit}
            onChange={(event) => updateField("addressLine2", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={form.city}
            required
            disabled={isPending || !profile.canEdit}
            onChange={(event) => updateField("city", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">County / State</Label>
          <Input
            id="state"
            value={form.state}
            disabled={isPending || !profile.canEdit}
            onChange={(event) => updateField("state", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal code</Label>
          <Input
            id="postalCode"
            value={form.postalCode}
            required
            disabled={isPending || !profile.canEdit}
            onChange={(event) => updateField("postalCode", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mapsLocation">Google Maps location</Label>
          <Input
            id="mapsLocation"
            value={form.mapsLocation ?? ""}
            disabled
            placeholder="Coming soon"
            aria-describedby="maps-location-help"
            className={cn("opacity-70")}
          />
          <p id="maps-location-help" className="text-muted-foreground text-xs">
            Map integration will be available in a future release.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BusinessFormStatus state={saveState} />
        <Button type="submit" disabled={isPending || !profile.canEdit || !isDirty}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save address
        </Button>
      </div>
    </form>
  );
}
