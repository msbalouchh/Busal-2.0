"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { FormWrapper } from "@/components/common/form-wrapper";
import {
  INDUSTRY_MODULE_RECOMMENDATIONS,
  MODULE_OPTIONS,
} from "@/modules/business-onboarding/constants/onboarding-options";
import { WORKSPACE_FORM_IDS } from "@/modules/business-onboarding/constants/workspace-steps";
import {
  modulesSchema,
  type ModulesValues,
} from "@/modules/business-onboarding/schemas/onboarding.schema";
import { useWorkspaceWizardStore } from "@/modules/business-onboarding/store/onboarding.store";
import { cn } from "@/lib/utils";

interface ModulesStepProps {
  onContinue: () => void;
}

export function ModulesStep({ onContinue }: ModulesStepProps) {
  const data = useWorkspaceWizardStore();
  const recommended =
    INDUSTRY_MODULE_RECOMMENDATIONS[data.industry] ?? INDUSTRY_MODULE_RECOMMENDATIONS.Other!;

  const form = useForm<ModulesValues>({
    resolver: zodResolver(modulesSchema),
    defaultValues: { modules: data.modules.length > 0 ? data.modules : recommended },
  });

  const selected = form.watch("modules");

  useEffect(() => {
    if (data.modules.length === 0 && recommended.length > 0) {
      form.setValue("modules", recommended);
    }
  }, [data.modules.length, form, recommended]);

  function toggleModule(id: string) {
    const next = selected.includes(id) ? selected.filter((m) => m !== id) : [...selected, id];
    form.setValue("modules", next, { shouldValidate: true });
  }

  return (
    <FormWrapper
      id={WORKSPACE_FORM_IDS.modules}
      form={form}
      className="onboarding__form"
      onSubmit={(values) => {
        data.patch(values);
        onContinue();
      }}
    >
      <p className="text-sm text-white/55">
        Recommended for{" "}
        <strong className="text-white/80">{data.industry || "your industry"}</strong>
      </p>
      <div className="onboarding__option-grid">
        {MODULE_OPTIONS.map((module) => {
          const isRecommended = recommended.includes(module.id);
          const isSelected = selected.includes(module.id);
          return (
            <button
              key={module.id}
              type="button"
              className={cn("onboarding__option", isSelected && "is-selected")}
              onClick={() => toggleModule(module.id)}
            >
              <span className="flex items-center gap-2">
                <span className="onboarding__option-title">{module.label}</span>
                {isRecommended ? <span className="onboarding__badge">Recommended</span> : null}
              </span>
              <span className="onboarding__option-desc">{module.description}</span>
            </button>
          );
        })}
      </div>
      {form.formState.errors.modules ? (
        <p className="onboarding__field-error" role="alert">
          {form.formState.errors.modules.message}
        </p>
      ) : null}
      <button type="submit" className="sr-only">
        Continue
      </button>
    </FormWrapper>
  );
}
