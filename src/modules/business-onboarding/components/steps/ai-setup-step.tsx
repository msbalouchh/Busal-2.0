"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormWrapper } from "@/components/common/form-wrapper";
import { AI_CAPABILITY_OPTIONS } from "@/modules/business-onboarding/constants/onboarding-options";
import {
  aiSetupSchema,
  type AiSetupValues,
} from "@/modules/business-onboarding/schemas/onboarding.schema";
import { useOnboardingStore } from "@/modules/business-onboarding/store/onboarding.store";
import { cn } from "@/lib/utils";

interface AiSetupStepProps {
  onContinue: () => void;
}

export function AiSetupStep({ onContinue }: AiSetupStepProps) {
  const data = useOnboardingStore();

  const form = useForm<AiSetupValues>({
    resolver: zodResolver(aiSetupSchema),
    defaultValues: {
      aiCapabilities:
        data.aiCapabilities.length > 0
          ? data.aiCapabilities
          : ["operations", "customer-support", "marketing"],
    },
  });

  const selected = form.watch("aiCapabilities");

  function toggleCapability(id: string) {
    const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
    form.setValue("aiCapabilities", next, { shouldValidate: true });
  }

  return (
    <FormWrapper
      id="onboarding-form-ai"
      form={form}
      className="onboarding__form"
      onSubmit={(values) => {
        data.patch(values);
        onContinue();
      }}
    >
      <p className="text-sm text-white/55">
        What should Busal AI help with? Select all that apply.
      </p>

      <div className="onboarding__option-grid onboarding__option-grid--2">
        {AI_CAPABILITY_OPTIONS.map((capability) => (
          <button
            key={capability.id}
            type="button"
            className={cn("onboarding__option", selected.includes(capability.id) && "is-selected")}
            onClick={() => toggleCapability(capability.id)}
          >
            <span className="onboarding__option-title">{capability.label}</span>
          </button>
        ))}
      </div>

      {form.formState.errors.aiCapabilities ? (
        <p className="onboarding__field-error" role="alert">
          {form.formState.errors.aiCapabilities.message}
        </p>
      ) : null}

      <button type="submit" className="sr-only">
        Continue
      </button>
    </FormWrapper>
  );
}
