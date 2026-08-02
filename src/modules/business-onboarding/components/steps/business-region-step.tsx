"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";

import { FormWrapper } from "@/components/common/form-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  goToBusinessSetupStepAction,
  saveBusinessRegionAction,
} from "@/modules/business-onboarding/actions/business-setup-actions";
import {
  CURRENCY_OPTIONS,
  INDUSTRY_OPTIONS,
  TIMEZONE_OPTIONS,
} from "@/modules/business-onboarding/constants/business-setup-steps";
import {
  businessRegionSchema,
  type BusinessRegionValues,
} from "@/modules/business-onboarding/schemas/business-setup.schema";
import type { BusinessSetupProfile } from "@/services/business-setup.service";
import { cn } from "@/lib/utils";

interface BusinessRegionStepProps {
  profile: BusinessSetupProfile;
}

export function BusinessRegionStep({ profile }: BusinessRegionStepProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<BusinessRegionValues>({
    resolver: zodResolver(businessRegionSchema),
    defaultValues: {
      industry: profile.industry ?? "",
      country: profile.country ?? "",
      currency: profile.currency ?? "GBP",
      timezone: profile.timezone ?? "Europe/London",
    },
  });

  return (
    <FormWrapper
      form={form}
      onSubmit={(values) => {
        startTransition(async () => {
          await saveBusinessRegionAction(values);
          router.refresh();
        });
      }}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <select
            id="industry"
            disabled={isPending}
            className={cn(
              "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
            )}
            {...form.register("industry")}
          >
            <option value="">Select industry</option>
            {INDUSTRY_OPTIONS.map((option) => (
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
            placeholder="United Kingdom"
            disabled={isPending}
            {...form.register("country")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <select
            id="currency"
            disabled={isPending}
            className={cn(
              "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
            )}
            {...form.register("currency")}
          >
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <select
            id="timezone"
            disabled={isPending}
            className={cn(
              "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
            )}
            {...form.register("timezone")}
          >
            {TIMEZONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await goToBusinessSetupStepAction(1);
              router.refresh();
            });
          }}
        >
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save & continue
        </Button>
      </div>
    </FormWrapper>
  );
}
