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
  saveBusinessContactAction,
} from "@/modules/business-onboarding/actions/business-setup-actions";
import {
  businessContactSchema,
  type BusinessContactValues,
} from "@/modules/business-onboarding/schemas/business-setup.schema";
import type { BusinessSetupProfile } from "@/services/business-setup.service";

interface BusinessContactStepProps {
  profile: BusinessSetupProfile;
  userEmail: string;
}

export function BusinessContactStep({ profile, userEmail }: BusinessContactStepProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<BusinessContactValues>({
    resolver: zodResolver(businessContactSchema),
    defaultValues: {
      phone: profile.phone ?? "",
      businessEmail: profile.businessEmail ?? userEmail,
    },
  });

  return (
    <FormWrapper
      form={form}
      onSubmit={(values) => {
        startTransition(async () => {
          await saveBusinessContactAction(values);
          router.refresh();
        });
      }}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+44 20 7946 0958"
            disabled={isPending}
            {...form.register("phone")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessEmail">Business email</Label>
          <Input
            id="businessEmail"
            type="email"
            placeholder="hello@yourbusiness.com"
            disabled={isPending}
            {...form.register("businessEmail")}
          />
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
              await goToBusinessSetupStepAction(2);
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
