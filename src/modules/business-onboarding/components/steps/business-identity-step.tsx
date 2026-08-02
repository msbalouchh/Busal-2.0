"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { FormWrapper } from "@/components/common/form-wrapper";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  BUSINESS_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
} from "@/modules/business-onboarding/constants/onboarding-options";
import { WORKSPACE_FORM_IDS } from "@/modules/business-onboarding/constants/workspace-steps";
import { OnboardingField } from "@/modules/business-onboarding/components/onboarding-ui";
import { syncIdentityIdentifiers } from "@/modules/business-onboarding/lib/workspace-identifiers";
import {
  businessIdentitySchema,
  type BusinessIdentityValues,
} from "@/modules/business-onboarding/schemas/onboarding.schema";
import { useWorkspaceWizardStore } from "@/modules/business-onboarding/store/onboarding.store";

interface BusinessIdentityStepProps {
  onContinue: () => void;
}

export function BusinessIdentityStep({ onContinue }: BusinessIdentityStepProps) {
  const data = useWorkspaceWizardStore();

  const form = useForm<BusinessIdentityValues>({
    resolver: zodResolver(businessIdentitySchema),
    defaultValues: {
      businessName: data.businessName,
      legalBusinessName: data.legalBusinessName || data.businessName,
      displayName: data.displayName || data.businessName,
      businessType: data.businessType,
      industry: data.industry,
      businessEmail: data.businessEmail,
      phone: data.phone,
      website: data.website,
      taxNumber: data.taxNumber,
      registrationNumber: data.registrationNumber,
    },
  });

  const businessName = form.watch("businessName");
  const workspaceSlug = useWorkspaceWizardStore((s) => s.workspaceSlug);
  const businessId = useWorkspaceWizardStore((s) => s.businessId);
  const tenantId = useWorkspaceWizardStore((s) => s.tenantId);

  useEffect(() => {
    if (!businessName.trim()) return;
    const ids = syncIdentityIdentifiers(businessName);
    useWorkspaceWizardStore.getState().patch(ids);
    if (!form.getValues("legalBusinessName")) form.setValue("legalBusinessName", businessName);
    if (!form.getValues("displayName")) form.setValue("displayName", businessName);
  }, [businessName, form]);

  return (
    <FormWrapper
      id={WORKSPACE_FORM_IDS.identity}
      form={form}
      className="onboarding__form"
      onSubmit={(values) => {
        const ids = syncIdentityIdentifiers(values.businessName);
        data.patch({ ...values, ...ids });
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
          id="legalBusinessName"
          label="Legal business name"
          error={form.formState.errors.legalBusinessName?.message}
        >
          <Input id="legalBusinessName" {...form.register("legalBusinessName")} />
        </OnboardingField>
        <OnboardingField
          id="displayName"
          label="Display name"
          error={form.formState.errors.displayName?.message}
        >
          <Input id="displayName" {...form.register("displayName")} />
        </OnboardingField>
      </div>

      <div className="onboarding__grid-2">
        <OnboardingField
          id="industry"
          label="Industry"
          error={form.formState.errors.industry?.message}
        >
          <Select id="industry" {...form.register("industry")}>
            <option value="">Select industry</option>
            {INDUSTRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
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
            {BUSINESS_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
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
        <Input id="businessEmail" type="email" {...form.register("businessEmail")} />
      </OnboardingField>

      <div className="onboarding__grid-2">
        <OnboardingField
          id="phone"
          label="Phone number"
          error={form.formState.errors.phone?.message}
        >
          <Input id="phone" type="tel" {...form.register("phone")} />
        </OnboardingField>
        <OnboardingField
          id="website"
          label="Website (optional)"
          error={form.formState.errors.website?.message}
        >
          <Input id="website" type="url" {...form.register("website")} />
        </OnboardingField>
      </div>

      <div className="onboarding__grid-2">
        <OnboardingField id="taxNumber" label="Tax number (optional)">
          <Input id="taxNumber" {...form.register("taxNumber")} />
        </OnboardingField>
        <OnboardingField id="registrationNumber" label="Registration number (optional)">
          <Input id="registrationNumber" {...form.register("registrationNumber")} />
        </OnboardingField>
      </div>

      <div className="onboarding__generated-ids">
        <p className="onboarding__generated-ids-label">Auto-generated identifiers</p>
        <dl>
          <div>
            <dt>Workspace slug</dt>
            <dd>{workspaceSlug || "—"}</dd>
          </div>
          <div>
            <dt>Business ID</dt>
            <dd>{businessId || "—"}</dd>
          </div>
          <div>
            <dt>Tenant ID</dt>
            <dd>{tenantId || "—"}</dd>
          </div>
        </dl>
      </div>

      <button type="submit" className="sr-only">
        Continue
      </button>
    </FormWrapper>
  );
}
