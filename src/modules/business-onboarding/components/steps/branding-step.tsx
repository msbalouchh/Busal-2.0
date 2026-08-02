"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormWrapper } from "@/components/common/form-wrapper";
import { Input } from "@/components/ui/input";
import { OnboardingField } from "@/modules/business-onboarding/components/onboarding-ui";
import {
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
} from "@/modules/business-onboarding/constants/onboarding-options";
import {
  brandingSchema,
  type BrandingValues,
} from "@/modules/business-onboarding/schemas/onboarding.schema";
import { useOnboardingStore } from "@/modules/business-onboarding/store/onboarding.store";

interface BrandingStepProps {
  onContinue: () => void;
}

export function BrandingStep({ onContinue }: BrandingStepProps) {
  const data = useOnboardingStore();

  const form = useForm<BrandingValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      primaryColor: data.primaryColor || DEFAULT_PRIMARY_COLOR,
      secondaryColor: data.secondaryColor || DEFAULT_SECONDARY_COLOR,
      logoDataUrl: data.logoDataUrl,
    },
  });

  const primaryColor = form.watch("primaryColor");
  const secondaryColor = form.watch("secondaryColor");
  const logoDataUrl = form.watch("logoDataUrl");

  function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      form.setValue("logoDataUrl", String(reader.result), { shouldValidate: true });
    };
    reader.readAsDataURL(file);
  }

  return (
    <FormWrapper
      id="onboarding-form-branding"
      form={form}
      className="onboarding__form"
      onSubmit={(values) => {
        data.patch(values);
        onContinue();
      }}
    >
      <OnboardingField id="logo" label="Business logo">
        <Input id="logo" type="file" accept="image/*" onChange={handleLogoUpload} />
      </OnboardingField>

      <div className="onboarding__grid-2">
        <OnboardingField
          id="primaryColor"
          label="Primary color"
          error={form.formState.errors.primaryColor?.message}
        >
          <Input id="primaryColor" type="color" {...form.register("primaryColor")} />
        </OnboardingField>

        <OnboardingField
          id="secondaryColor"
          label="Secondary color"
          error={form.formState.errors.secondaryColor?.message}
        >
          <Input id="secondaryColor" type="color" {...form.register("secondaryColor")} />
        </OnboardingField>
      </div>

      <div className="onboarding__brand-preview" aria-label="Branding preview">
        <div className="onboarding__brand-preview-bar" style={{ background: primaryColor }} />
        <div className="onboarding__brand-preview-header">
          <div className="onboarding__brand-preview-logo">
            {logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoDataUrl} alt="" />
            ) : (
              <span className="text-xs text-white/40">Logo</span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {data.businessName || "Your business"}
            </p>
            <p className="text-xs text-white/45">Live preview</p>
          </div>
        </div>
        <div
          className="h-2 rounded-full"
          style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }}
        />
      </div>

      <button type="submit" className="sr-only">
        Continue
      </button>
    </FormWrapper>
  );
}
