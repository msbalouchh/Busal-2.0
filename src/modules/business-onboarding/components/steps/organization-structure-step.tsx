"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormWrapper } from "@/components/common/form-wrapper";
import { Input } from "@/components/ui/input";
import { WORKSPACE_FORM_IDS } from "@/modules/business-onboarding/constants/workspace-steps";
import { OnboardingField } from "@/modules/business-onboarding/components/onboarding-ui";
import {
  organizationSchema,
  type OrganizationValues,
} from "@/modules/business-onboarding/schemas/onboarding.schema";
import { useWorkspaceWizardStore } from "@/modules/business-onboarding/store/onboarding.store";
import { cn } from "@/lib/utils";

interface OrganizationStructureStepProps {
  onContinue: () => void;
}

export function OrganizationStructureStep({ onContinue }: OrganizationStructureStepProps) {
  const data = useWorkspaceWizardStore();

  const form = useForm<OrganizationValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      structure: data.structure,
      branchCount: data.branchCount,
      defaultBranchName: data.defaultBranchName || "Main Branch",
    },
  });

  const structure = form.watch("structure");

  return (
    <FormWrapper
      id={WORKSPACE_FORM_IDS.organization}
      form={form}
      className="onboarding__form"
      onSubmit={(values) => {
        data.patch({
          structure: values.structure,
          branchCount: values.structure === "single" ? 1 : values.branchCount,
          defaultBranchName: values.defaultBranchName,
        });
        onContinue();
      }}
    >
      <div className="onboarding__option-grid onboarding__option-grid--2">
        {(
          [
            {
              value: "single",
              title: "Single location",
              desc: "One site — branch architecture ready to scale",
            },
            {
              value: "multi",
              title: "Multi location",
              desc: "Multiple branches with centralized tenant control",
            },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            className={cn("onboarding__option", structure === option.value && "is-selected")}
            onClick={() => {
              form.setValue("structure", option.value, { shouldValidate: true });
              if (option.value === "single") form.setValue("branchCount", 1);
              else if (form.getValues("branchCount") < 2) form.setValue("branchCount", 2);
            }}
          >
            <span className="onboarding__option-title">{option.title}</span>
            <span className="onboarding__option-desc">{option.desc}</span>
          </button>
        ))}
      </div>

      {structure === "multi" ? (
        <>
          <OnboardingField
            id="branchCount"
            label="Number of branches"
            error={form.formState.errors.branchCount?.message}
          >
            <Input
              id="branchCount"
              type="number"
              min={2}
              max={5000}
              {...form.register("branchCount")}
            />
          </OnboardingField>
          <OnboardingField
            id="defaultBranchName"
            label="Default branch name"
            error={form.formState.errors.defaultBranchName?.message}
          >
            <Input
              id="defaultBranchName"
              placeholder="Head Office"
              {...form.register("defaultBranchName")}
            />
          </OnboardingField>
        </>
      ) : (
        <OnboardingField
          id="defaultBranchName"
          label="Branch name"
          error={form.formState.errors.defaultBranchName?.message}
        >
          <Input id="defaultBranchName" {...form.register("defaultBranchName")} />
        </OnboardingField>
      )}

      <button type="submit" className="sr-only">
        Continue
      </button>
    </FormWrapper>
  );
}
