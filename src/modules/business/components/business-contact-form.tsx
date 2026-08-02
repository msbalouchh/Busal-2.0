"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveBusinessContactInfoAction } from "@/modules/business/actions/business-profile-actions";
import { BusinessFormStatus } from "@/modules/business/components/business-form-status";
import { useUnsavedChanges } from "@/modules/business/hooks/use-unsaved-changes";
import type { SerializedBusinessProfile } from "@/modules/business/types/business-profile-types";

interface BusinessContactFormProps {
  profile: SerializedBusinessProfile;
}

type SaveState = "idle" | "saving" | "saved" | "error";

const SOCIAL_FIELDS = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "twitter", label: "Twitter / X" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "tiktok", label: "TikTok" },
  { key: "youtube", label: "YouTube" },
] as const;

function readContact(profile: SerializedBusinessProfile, type: "EMAIL" | "PHONE" | "WEBSITE") {
  return profile.contacts.find((contact) => contact.type === type)?.value ?? "";
}

export function BusinessContactForm({ profile }: BusinessContactFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [form, setForm] = useState({
    email: readContact(profile, "EMAIL"),
    phone: readContact(profile, "PHONE"),
    website: readContact(profile, "WEBSITE"),
    supportEmail: profile.supportEmail,
    socialLinks: profile.socialLinks,
  });

  const initialSnapshot = useMemo(
    () =>
      JSON.stringify({
        email: readContact(profile, "EMAIL"),
        phone: readContact(profile, "PHONE"),
        website: readContact(profile, "WEBSITE"),
        supportEmail: profile.supportEmail,
        socialLinks: profile.socialLinks,
      }),
    [profile],
  );
  const isDirty = JSON.stringify(form) !== initialSnapshot;
  useUnsavedChanges(isDirty && !isPending);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profile.canEdit) {
      toast.error("You do not have permission to edit contact information.");
      return;
    }

    startTransition(async () => {
      setSaveState("saving");

      try {
        await saveBusinessContactInfoAction({
          email: form.email,
          phone: form.phone,
          website: form.website,
          supportEmail: form.supportEmail,
          socialLinks: form.socialLinks,
          contacts: [],
        });
        setSaveState("saved");
        toast.success("Contact information saved");
      } catch (error) {
        setSaveState("error");
        toast.error(error instanceof Error ? error.message : "Unable to save contact information");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      <section className="space-y-4" aria-labelledby="primary-contact-heading">
        <h2 id="primary-contact-heading" className="text-lg font-semibold">
          Primary contact
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              disabled={isPending || !profile.canEdit}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              disabled={isPending || !profile.canEdit}
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={form.website}
              disabled={isPending || !profile.canEdit}
              onChange={(event) =>
                setForm((current) => ({ ...current, website: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="supportEmail">Support email</Label>
            <Input
              id="supportEmail"
              type="email"
              value={form.supportEmail}
              disabled={isPending || !profile.canEdit}
              onChange={(event) =>
                setForm((current) => ({ ...current, supportEmail: event.target.value }))
              }
            />
          </div>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="social-links-heading">
        <h2 id="social-links-heading" className="text-lg font-semibold">
          Social links
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                value={form.socialLinks[field.key]}
                disabled={isPending || !profile.canEdit}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    socialLinks: { ...current.socialLinks, [field.key]: event.target.value },
                  }))
                }
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BusinessFormStatus state={saveState} />
        <Button type="submit" disabled={isPending || !profile.canEdit || !isDirty}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save contact information
        </Button>
      </div>
    </form>
  );
}
