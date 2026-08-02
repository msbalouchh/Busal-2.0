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
import { saveBusinessIdentityAction } from "@/modules/business-onboarding/actions/business-setup-actions";
import {
  businessIdentitySchema,
  type BusinessIdentityValues,
} from "@/modules/business-onboarding/schemas/business-setup.schema";
import { BUSINESS_TYPE_OPTIONS } from "@/modules/onboarding/lib/business-interview-questions";
import type { BusinessSetupProfile } from "@/services/business-setup.service";
import { cn } from "@/lib/utils";

interface BusinessIdentityStepProps {
  profile: BusinessSetupProfile;
}

export function BusinessIdentityStep({ profile }: BusinessIdentityStepProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<BusinessIdentityValues>({
    resolver: zodResolver(businessIdentitySchema),
    defaultValues: {
      businessName: profile.businessName ?? "",
      businessType: profile.businessType ?? "",
    },
  });

  return (
    <FormWrapper
      form={form}
      onSubmit={(values) => {
        startTransition(async () => {
          await saveBusinessIdentityAction(values);
          router.refresh();
        });
      }}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business name</Label>
          <Input
            id="businessName"
            placeholder="Harbor & Hearth Bistro"
            disabled={isPending}
            {...form.register("businessName")}
          />
          {form.formState.errors.businessName ? (
            <p className="text-destructive text-sm">{form.formState.errors.businessName.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessType">Business type</Label>
          <select
            id="businessType"
            disabled={isPending}
            className={cn(
              "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
            )}
            {...form.register("businessType")}
          >
            <option value="">Select business type</option>
            {BUSINESS_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {form.formState.errors.businessType ? (
            <p className="text-destructive text-sm">{form.formState.errors.businessType.message}</p>
          ) : null}
        </div>
      </div>

      <Button type="submit" className="mt-6 w-full" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Save & continue
      </Button>
    </FormWrapper>
  );
}
