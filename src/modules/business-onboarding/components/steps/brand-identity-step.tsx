"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormWrapper } from "@/components/common/form-wrapper";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
} from "@/modules/business-onboarding/constants/onboarding-options";
import { WORKSPACE_FORM_IDS } from "@/modules/business-onboarding/constants/workspace-steps";
import { OnboardingField } from "@/modules/business-onboarding/components/onboarding-ui";
import {
  brandIdentitySchema,
  type BrandIdentityValues,
} from "@/modules/business-onboarding/schemas/onboarding.schema";
import { useWorkspaceWizardStore } from "@/modules/business-onboarding/store/onboarding.store";

interface BrandIdentityStepProps {
  onContinue: () => void;
}

export function BrandIdentityStep({ onContinue }: BrandIdentityStepProps) {
  const data = useWorkspaceWizardStore();

  const form = useForm<BrandIdentityValues>({
    resolver: zodResolver(brandIdentitySchema),
    defaultValues: {
      primaryColor: data.primaryColor || DEFAULT_PRIMARY_COLOR,
      secondaryColor: data.secondaryColor || DEFAULT_SECONDARY_COLOR,
      accentColor: data.accentColor || DEFAULT_ACCENT_COLOR,
      themePreference: data.themePreference || "dark",
      logoDataUrl: data.logoDataUrl,
    },
  });

  const primaryColor = form.watch("primaryColor");
  const secondaryColor = form.watch("secondaryColor");
  const accentColor = form.watch("accentColor");
  const logoDataUrl = form.watch("logoDataUrl");

  function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      form.setValue("logoDataUrl", String(reader.result), { shouldValidate: true });
    reader.readAsDataURL(file);
  }

  return (
    <FormWrapper
      id={WORKSPACE_FORM_IDS.brand}
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

      <div className="onboarding__grid-2">
        <OnboardingField
          id="accentColor"
          label="Accent color"
          error={form.formState.errors.accentColor?.message}
        >
          <Input id="accentColor" type="color" {...form.register("accentColor")} />
        </OnboardingField>
        <OnboardingField
          id="themePreference"
          label="Theme preference"
          error={form.formState.errors.themePreference?.message}
        >
          <Select id="themePreference" {...form.register("themePreference")}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </Select>
        </OnboardingField>
      </div>

      <div className="onboarding__brand-preview" aria-label="Brand preview">
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
              {data.displayName || "Your workspace"}
            </p>
            <p className="text-xs text-white/45">Live brand preview</p>
          </div>
        </div>
        <div
          className="h-2 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor}, ${accentColor})`,
          }}
        />
      </div>

      <button type="submit" className="sr-only">
        Continue
      </button>
    </FormWrapper>
  );
}
