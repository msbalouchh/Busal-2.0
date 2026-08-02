"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormWrapper } from "@/components/common/form-wrapper";
import { Input } from "@/components/ui/input";
import { OnboardingField } from "@/modules/business-onboarding/components/onboarding-ui";
import {
  structureSchema,
  type StructureValues,
} from "@/modules/business-onboarding/schemas/onboarding.schema";
import { useOnboardingStore } from "@/modules/business-onboarding/store/onboarding.store";
import { cn } from "@/lib/utils";

interface StructureStepProps {
  onContinue: () => void;
}

export function StructureStep({ onContinue }: StructureStepProps) {
  const data = useOnboardingStore();

  const form = useForm<StructureValues>({
    resolver: zodResolver(structureSchema),
    defaultValues: {
      structure: data.structure,
      branchCount: data.branchCount,
    },
  });

  const structure = form.watch("structure");

  return (
    <FormWrapper
      id="onboarding-form-structure"
      form={form}
      className="onboarding__form"
      onSubmit={(values) => {
        data.patch({
          structure: values.structure,
          branchCount: values.structure === "single" ? 1 : values.branchCount,
        });
        onContinue();
      }}
    >
      <div className="onboarding__option-grid onboarding__option-grid--2">
        {(
          [
            { value: "single", title: "Single location", desc: "One site or venue" },
            { value: "multi", title: "Multi location", desc: "Multiple branches or sites" },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            className={cn("onboarding__option", structure === option.value && "is-selected")}
            onClick={() => {
              form.setValue("structure", option.value, { shouldValidate: true });
              if (option.value === "single") {
                form.setValue("branchCount", 1);
              } else if (form.getValues("branchCount") < 2) {
                form.setValue("branchCount", 2);
              }
            }}
          >
            <span className="onboarding__option-title">{option.title}</span>
            <span className="onboarding__option-desc">{option.desc}</span>
          </button>
        ))}
      </div>

      {structure === "multi" ? (
        <OnboardingField
          id="branchCount"
          label="Number of branches"
          error={form.formState.errors.branchCount?.message}
        >
          <Input
            id="branchCount"
            type="number"
            min={2}
            max={500}
            {...form.register("branchCount")}
          />
        </OnboardingField>
      ) : null}

      <button type="submit" className="sr-only">
        Continue
      </button>
    </FormWrapper>
  );
}
