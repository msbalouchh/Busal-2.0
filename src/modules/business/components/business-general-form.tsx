"use client";

import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveGeneralBusinessAction } from "@/modules/business/actions/business-actions";
import { BUSINESS_TYPE_OPTIONS } from "@/modules/onboarding/lib/business-interview-questions";
import type { BusinessProfileData } from "@/types/business-profile";
import { cn } from "@/lib/utils";

interface BusinessGeneralFormProps {
  business: BusinessProfileData;
}

export function BusinessGeneralForm({ business }: BusinessGeneralFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        await saveGeneralBusinessAction({
          businessName: String(formData.get("businessName") ?? ""),
          businessType: String(
            formData.get("businessType") ?? "OTHER",
          ) as (typeof BUSINESS_TYPE_OPTIONS)[number]["value"],
          country: String(formData.get("country") ?? ""),
          timezone: String(formData.get("timezone") ?? ""),
          ownerName: String(formData.get("ownerName") ?? ""),
        });
        toast.success("Business information saved");
      } catch {
        toast.error("Unable to save business information");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="businessName">Business name</Label>
        <Input
          id="businessName"
          name="businessName"
          defaultValue={business.businessName ?? ""}
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessType">Business type</Label>
        <select
          id="businessType"
          name="businessType"
          defaultValue={business.businessType ?? "OTHER"}
          disabled={isPending}
          className={cn(
            "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
          )}
        >
          {BUSINESS_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Input
          id="country"
          name="country"
          defaultValue={business.country ?? ""}
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Input
          id="timezone"
          name="timezone"
          defaultValue={business.timezone ?? ""}
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ownerName">Owner name</Label>
        <Input
          id="ownerName"
          name="ownerName"
          defaultValue={business.ownerName ?? ""}
          disabled={isPending}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Save changes
      </Button>
    </form>
  );
}
