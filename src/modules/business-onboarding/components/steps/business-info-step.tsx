"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormWrapper } from "@/components/common/form-wrapper";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  BUSINESS_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
} from "@/modules/business-onboarding/constants/onboarding-options";
import { OnboardingField } from "@/modules/business-onboarding/components/onboarding-ui";
import {
  businessInfoSchema,
  type BusinessInfoValues,
} from "@/modules/business-onboarding/schemas/onboarding.schema";
import { useOnboardingStore } from "@/modules/business-onboarding/store/onboarding.store";

interface BusinessInfoStepProps {
  onContinue: () => void;
}

export function BusinessInfoStep({ onContinue }: BusinessInfoStepProps) {
  const data = useOnboardingStore();

  const form = useForm<BusinessInfoValues>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      businessName: data.businessName,
      industry: data.industry,
      businessType: data.businessType,
      businessEmail: data.businessEmail,
      phone: data.phone,
      website: data.website,
    },
  });

  return (
    <FormWrapper
      id="onboarding-form-business-info"
      form={form}
      className="onboarding__form"
      onSubmit={(values) => {
        data.patch(values);
        onContinue();
      }}
    >
      <OnboardingField
        id="businessName"
        label="Business name"
        error={form.formState.errors.businessName?.message}
      >
        <Input
          id="businessName"
          placeholder="Harbour Kitchen Group"
          {...form.register("businessName")}
        />
      </OnboardingField>

      <div className="onboarding__grid-2">
        <OnboardingField
          id="industry"
          label="Industry"
          error={form.formState.errors.industry?.message}
        >
          <Select id="industry" {...form.register("industry")}>
            <option value="">Select industry</option>
            {INDUSTRY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </OnboardingField>

        <OnboardingField
          id="businessType"
          label="Business type"
          error={form.formState.errors.businessType?.message}
        >
          <Select id="businessType" {...form.register("businessType")}>
            <option value="">Select type</option>
            {BUSINESS_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </OnboardingField>
      </div>

      <OnboardingField
        id="businessEmail"
        label="Business email"
        error={form.formState.errors.businessEmail?.message}
      >
        <Input
          id="businessEmail"
          type="email"
          placeholder="hello@company.com"
          {...form.register("businessEmail")}
        />
      </OnboardingField>

      <div className="onboarding__grid-2">
        <OnboardingField
          id="phone"
          label="Phone number"
          error={form.formState.errors.phone?.message}
        >
          <Input id="phone" type="tel" placeholder="+44 20 7946 0958" {...form.register("phone")} />
        </OnboardingField>

        <OnboardingField
          id="website"
          label="Website (optional)"
          error={form.formState.errors.website?.message}
        >
          <Input
            id="website"
            type="url"
            placeholder="https://company.com"
            {...form.register("website")}
          />
        </OnboardingField>
      </div>

      <button type="submit" className="sr-only">
        Continue
      </button>
    </FormWrapper>
  );
}
