"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveBusinessBrandingAction } from "@/modules/business/actions/business-profile-actions";
import { BusinessFileUploadField } from "@/modules/business/components/business-file-upload-field";
import { BusinessFormStatus } from "@/modules/business/components/business-form-status";
import { useUnsavedChanges } from "@/modules/business/hooks/use-unsaved-changes";
import type { SerializedBusinessProfile } from "@/modules/business/types/business-profile-types";

interface BusinessBrandingPanelProps {
  profile: SerializedBusinessProfile;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function BusinessBrandingPanel({ profile }: BusinessBrandingPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [colors, setColors] = useState({
    primaryColor: profile.branding.primaryColor,
    secondaryColor: profile.branding.secondaryColor,
  });

  const initialSnapshot = useMemo(
    () =>
      JSON.stringify({
        primaryColor: profile.branding.primaryColor,
        secondaryColor: profile.branding.secondaryColor,
      }),
    [profile],
  );
  const isDirty = JSON.stringify(colors) !== initialSnapshot;
  useUnsavedChanges(isDirty && !isPending);

  const handleSaveColors = () => {
    if (!profile.canManageBranding) {
      toast.error("You do not have permission to manage branding.");
      return;
    }

    startTransition(async () => {
      setSaveState("saving");

      try {
        await saveBusinessBrandingAction(colors);
        setSaveState("saved");
        toast.success("Brand colours saved");
      } catch (error) {
        setSaveState("error");
        toast.error(error instanceof Error ? error.message : "Unable to save brand colours");
      }
    });
  };

  return (
    <div className="max-w-3xl space-y-8">
      <section className="space-y-4" aria-labelledby="brand-assets-heading">
        <h2 id="brand-assets-heading" className="text-lg font-semibold">
          Brand assets
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <BusinessFileUploadField
            label="Logo"
            assetType="logo"
            currentUrl={profile.branding.logoUrl}
            disabled={!profile.canManageBranding}
          />
          <BusinessFileUploadField
            label="Cover image"
            assetType="cover"
            currentUrl={profile.branding.coverUrl}
            disabled={!profile.canManageBranding}
            previewClassName="h-24 w-full sm:w-40"
          />
          <BusinessFileUploadField
            label="Favicon"
            assetType="favicon"
            currentUrl={profile.branding.faviconUrl}
            disabled={!profile.canManageBranding}
          />
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="brand-colours-heading">
        <h2 id="brand-colours-heading" className="text-lg font-semibold">
          Brand colours
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary colour</Label>
            <div className="flex items-center gap-3">
              <Input
                id="primaryColor"
                type="color"
                value={colors.primaryColor}
                disabled={isPending || !profile.canManageBranding}
                className="h-10 w-16 p-1"
                onChange={(event) =>
                  setColors((current) => ({ ...current, primaryColor: event.target.value }))
                }
              />
              <Input
                value={colors.primaryColor}
                disabled={isPending || !profile.canManageBranding}
                onChange={(event) =>
                  setColors((current) => ({ ...current, primaryColor: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Secondary colour</Label>
            <div className="flex items-center gap-3">
              <Input
                id="secondaryColor"
                type="color"
                value={colors.secondaryColor}
                disabled={isPending || !profile.canManageBranding}
                className="h-10 w-16 p-1"
                onChange={(event) =>
                  setColors((current) => ({ ...current, secondaryColor: event.target.value }))
                }
              />
              <Input
                value={colors.secondaryColor}
                disabled={isPending || !profile.canManageBranding}
                onChange={(event) =>
                  setColors((current) => ({ ...current, secondaryColor: event.target.value }))
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="theme-preview-heading">
        <h2 id="theme-preview-heading" className="text-lg font-semibold">
          Theme preview
        </h2>
        <div
          className="overflow-hidden rounded-xl border"
          style={{
            borderColor: colors.secondaryColor,
          }}
        >
          <div className="px-4 py-3 text-white" style={{ backgroundColor: colors.primaryColor }}>
            <p className="font-semibold">{profile.businessName || "Business preview"}</p>
            <p className="text-sm opacity-90">Primary brand surface</p>
          </div>
          <div className="space-y-2 p-4">
            <div
              className="rounded-md px-3 py-2 text-sm text-white"
              style={{ backgroundColor: colors.secondaryColor }}
            >
              Secondary accent
            </div>
            <p className="text-muted-foreground text-sm">
              Preview how your primary and secondary colours appear across Busal OS.
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BusinessFormStatus state={saveState} />
        <Button
          type="button"
          disabled={isPending || !profile.canManageBranding || !isDirty}
          onClick={handleSaveColors}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save brand colours
        </Button>
      </div>
    </div>
  );
}
