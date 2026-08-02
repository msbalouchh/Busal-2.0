"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveRestaurantBrandingAction } from "@/modules/restaurant-management/actions/restaurant-management-actions";
import type {
  RestaurantBrandingInput,
  RestaurantBrandingRecord,
} from "@/modules/restaurant-management/types/restaurant-management-types";

interface RestaurantBrandingFormProps {
  branding: RestaurantBrandingRecord;
  disabled?: boolean;
}

export function RestaurantBrandingForm({
  branding,
  disabled = false,
}: RestaurantBrandingFormProps) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<RestaurantBrandingInput>({
    logo: branding.logo ?? "",
    coverImage: branding.coverImage ?? "",
    primaryColor: branding.primaryColor ?? "#2563EB",
    secondaryColor: branding.secondaryColor ?? "#F97316",
    receiptFooter: branding.receiptFooter ?? "",
    website: branding.website ?? "",
    facebook: branding.facebook ?? "",
    instagram: branding.instagram ?? "",
    tiktok: branding.tiktok ?? "",
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      try {
        await saveRestaurantBrandingAction(form);
        toast.success("Restaurant branding saved");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save branding");
      }
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit} aria-label="Restaurant branding form">
      <section className="space-y-4 rounded-xl border p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Visual identity</h2>
          <p className="text-muted-foreground text-sm">Logo, cover image, and brand colours.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="restaurant-logo">Logo URL</Label>
            <Input
              id="restaurant-logo"
              disabled={disabled || isPending}
              value={form.logo ?? ""}
              onChange={(event) => setForm({ ...form, logo: event.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="restaurant-cover">Cover image URL</Label>
            <Input
              id="restaurant-cover"
              disabled={disabled || isPending}
              value={form.coverImage ?? ""}
              onChange={(event) => setForm({ ...form, coverImage: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurant-primary-color">Primary colour</Label>
            <div className="flex gap-2">
              <Input
                id="restaurant-primary-color"
                disabled={disabled || isPending}
                value={form.primaryColor ?? ""}
                onChange={(event) => setForm({ ...form, primaryColor: event.target.value })}
              />
              <input
                type="color"
                aria-label="Primary colour picker"
                disabled={disabled || isPending}
                value={form.primaryColor ?? "#2563EB"}
                onChange={(event) => setForm({ ...form, primaryColor: event.target.value })}
                className="h-10 w-12 cursor-pointer rounded border"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurant-secondary-color">Secondary colour</Label>
            <div className="flex gap-2">
              <Input
                id="restaurant-secondary-color"
                disabled={disabled || isPending}
                value={form.secondaryColor ?? ""}
                onChange={(event) => setForm({ ...form, secondaryColor: event.target.value })}
              />
              <input
                type="color"
                aria-label="Secondary colour picker"
                disabled={disabled || isPending}
                value={form.secondaryColor ?? "#F97316"}
                onChange={(event) => setForm({ ...form, secondaryColor: event.target.value })}
                className="h-10 w-12 cursor-pointer rounded border"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Guest-facing content</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="restaurant-receipt-footer">Receipt footer</Label>
            <textarea
              id="restaurant-receipt-footer"
              className="border-input bg-background min-h-20 w-full rounded-md border px-3 py-2 text-sm"
              disabled={disabled || isPending}
              value={form.receiptFooter ?? ""}
              onChange={(event) => setForm({ ...form, receiptFooter: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurant-website">Website</Label>
            <Input
              id="restaurant-website"
              disabled={disabled || isPending}
              value={form.website ?? ""}
              onChange={(event) => setForm({ ...form, website: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurant-facebook">Facebook</Label>
            <Input
              id="restaurant-facebook"
              disabled={disabled || isPending}
              value={form.facebook ?? ""}
              onChange={(event) => setForm({ ...form, facebook: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurant-instagram">Instagram</Label>
            <Input
              id="restaurant-instagram"
              disabled={disabled || isPending}
              value={form.instagram ?? ""}
              onChange={(event) => setForm({ ...form, instagram: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurant-tiktok">TikTok</Label>
            <Input
              id="restaurant-tiktok"
              disabled={disabled || isPending}
              value={form.tiktok ?? ""}
              onChange={(event) => setForm({ ...form, tiktok: event.target.value })}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={disabled || isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save branding
        </Button>
      </div>
    </form>
  );
}
