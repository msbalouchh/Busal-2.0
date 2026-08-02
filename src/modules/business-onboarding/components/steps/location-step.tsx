"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { FormWrapper } from "@/components/common/form-wrapper";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  LANGUAGE_OPTIONS,
  TIME_FORMAT_OPTIONS,
  TIMEZONE_OPTIONS,
} from "@/modules/business-onboarding/constants/onboarding-options";
import { WORKSPACE_FORM_IDS } from "@/modules/business-onboarding/constants/workspace-steps";
import { OnboardingField } from "@/modules/business-onboarding/components/onboarding-ui";
import {
  detectCurrencyForCountry,
  detectLocationDefaults,
  detectTimezoneForCountry,
} from "@/modules/business-onboarding/lib/onboarding-detect";
import {
  locationSchema,
  type LocationValues,
} from "@/modules/business-onboarding/schemas/onboarding.schema";
import { useWorkspaceWizardStore } from "@/modules/business-onboarding/store/onboarding.store";

interface LocationStepProps {
  onContinue: () => void;
}

export function LocationStep({ onContinue }: LocationStepProps) {
  const data = useWorkspaceWizardStore();
  const defaults = detectLocationDefaults();

  const form = useForm<LocationValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      country: data.country || defaults.country,
      state: data.state,
      city: data.city,
      address: data.address,
      postalCode: data.postalCode,
      timezone: data.timezone || defaults.timezone,
      currency: data.currency || defaults.currency,
      language: data.language || defaults.language,
      dateFormat: data.dateFormat || defaults.dateFormat,
      timeFormat: data.timeFormat || defaults.timeFormat,
    },
  });

  const country = form.watch("country");

  useEffect(() => {
    if (!country) return;
    if (!data.country) {
      form.setValue("timezone", detectTimezoneForCountry(country));
      form.setValue("currency", detectCurrencyForCountry(country));
      form.setValue("dateFormat", country === "US" ? "MM/DD/YYYY" : "DD/MM/YYYY");
    }
  }, [country, data.country, form]);

  return (
    <FormWrapper
      id={WORKSPACE_FORM_IDS.location}
      form={form}
      className="onboarding__form"
      onSubmit={(values) => {
        data.patch(values);
        onContinue();
      }}
    >
      <div className="onboarding__grid-2">
        <OnboardingField
          id="country"
          label="Country"
          error={form.formState.errors.country?.message}
        >
          <Select id="country" {...form.register("country")}>
            <option value="">Select country</option>
            {COUNTRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </OnboardingField>
        <OnboardingField
          id="state"
          label="State / region"
          error={form.formState.errors.state?.message}
        >
          <Input id="state" placeholder="England" {...form.register("state")} />
        </OnboardingField>
      </div>

      <OnboardingField id="address" label="Address" error={form.formState.errors.address?.message}>
        <Input id="address" placeholder="123 High Street" {...form.register("address")} />
      </OnboardingField>

      <div className="onboarding__grid-2">
        <OnboardingField id="city" label="City" error={form.formState.errors.city?.message}>
          <Input id="city" {...form.register("city")} />
        </OnboardingField>
        <OnboardingField
          id="postalCode"
          label="Postal code"
          error={form.formState.errors.postalCode?.message}
        >
          <Input id="postalCode" {...form.register("postalCode")} />
        </OnboardingField>
      </div>

      <OnboardingField
        id="timezone"
        label="Timezone"
        error={form.formState.errors.timezone?.message}
      >
        <Select id="timezone" {...form.register("timezone")}>
          {TIMEZONE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </OnboardingField>

      <div className="onboarding__grid-2">
        <OnboardingField
          id="currency"
          label="Currency"
          error={form.formState.errors.currency?.message}
        >
          <Select id="currency" {...form.register("currency")}>
            {CURRENCY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </OnboardingField>
        <OnboardingField
          id="language"
          label="Language"
          error={form.formState.errors.language?.message}
        >
          <Select id="language" {...form.register("language")}>
            {LANGUAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </OnboardingField>
      </div>

      <div className="onboarding__grid-2">
        <OnboardingField
          id="dateFormat"
          label="Date format"
          error={form.formState.errors.dateFormat?.message}
        >
          <Select id="dateFormat" {...form.register("dateFormat")}>
            {DATE_FORMAT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </OnboardingField>
        <OnboardingField
          id="timeFormat"
          label="Time format"
          error={form.formState.errors.timeFormat?.message}
        >
          <Select id="timeFormat" {...form.register("timeFormat")}>
            {TIME_FORMAT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </OnboardingField>
      </div>

      <button type="submit" className="sr-only">
        Continue
      </button>
    </FormWrapper>
  );
}
