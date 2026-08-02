"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCustomerPreferencesAction } from "@/modules/customer-portal/actions/customer-portal-actions";

import type { NotificationDigestFrequency } from "@prisma/client";

import type { CustomerPreferencesData } from "@/modules/customer-portal/types/customer-portal";

interface CustomerPortalPreferencesPanelProps {
  preferences: CustomerPreferencesData;
}

export function CustomerPortalPreferencesPanel({
  preferences,
}: CustomerPortalPreferencesPanelProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="text-base">Notification & language preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            startTransition(async () => {
              try {
                await updateCustomerPreferencesAction({
                  preferredLanguage: String(formData.get("preferredLanguage") ?? "") || null,
                  marketingConsent: formData.get("marketingConsent") === "on",
                  emailEnabled: formData.get("emailEnabled") === "on",
                  pushEnabled: formData.get("pushEnabled") === "on",
                  smsEnabled: formData.get("smsEnabled") === "on",
                  digestFrequency: String(
                    formData.get("digestFrequency") ?? "DAILY",
                  ) as NotificationDigestFrequency,
                });
                toast.success("Preferences saved");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Unable to save preferences.");
              }
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="preferredLanguage">Preferred language</Label>
            <Input
              id="preferredLanguage"
              name="preferredLanguage"
              defaultValue={preferences.preferredLanguage}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="digestFrequency">Digest frequency</Label>
            <select
              id="digestFrequency"
              name="digestFrequency"
              defaultValue={preferences.digestFrequency}
              disabled={isPending}
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="NEVER">Never</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="marketingConsent"
              defaultChecked={preferences.marketingConsent}
            />
            Marketing emails
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="emailEnabled" defaultChecked={preferences.emailEnabled} />
            Email notifications
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="pushEnabled" defaultChecked={preferences.pushEnabled} />
            Push notifications
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="smsEnabled" defaultChecked={preferences.smsEnabled} />
            SMS notifications
          </label>
          <Button type="submit" disabled={isPending}>
            Save preferences
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
