"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormWrapper } from "@/components/common/form-wrapper";
import { AI_AGENT_OPTIONS } from "@/modules/business-onboarding/constants/onboarding-options";
import { WORKSPACE_FORM_IDS } from "@/modules/business-onboarding/constants/workspace-steps";
import {
  aiConfigurationSchema,
  type AiConfigurationValues,
} from "@/modules/business-onboarding/schemas/onboarding.schema";
import { useWorkspaceWizardStore } from "@/modules/business-onboarding/store/onboarding.store";
import { cn } from "@/lib/utils";

interface AiConfigurationStepProps {
  onContinue: () => void;
}

export function AiConfigurationStep({ onContinue }: AiConfigurationStepProps) {
  const data = useWorkspaceWizardStore();

  const form = useForm<AiConfigurationValues>({
    resolver: zodResolver(aiConfigurationSchema),
    defaultValues: {
      aiAgents:
        data.aiAgents.length > 0
          ? data.aiAgents
          : ["operations", "support", "knowledge", "workflow"],
    },
  });

  const selected = form.watch("aiAgents");

  function toggleAgent(id: string) {
    const next = selected.includes(id) ? selected.filter((a) => a !== id) : [...selected, id];
    form.setValue("aiAgents", next, { shouldValidate: true });
  }

  return (
    <FormWrapper
      id={WORKSPACE_FORM_IDS.ai}
      form={form}
      className="onboarding__form"
      onSubmit={(values) => {
        data.patch(values);
        onContinue();
      }}
    >
      <p className="text-sm text-white/55">
        Which AI agents should Busal enable for your workspace?
      </p>
      <div className="onboarding__option-grid onboarding__option-grid--2">
        {AI_AGENT_OPTIONS.map((agent) => (
          <button
            key={agent.id}
            type="button"
            className={cn("onboarding__option", selected.includes(agent.id) && "is-selected")}
            onClick={() => toggleAgent(agent.id)}
          >
            <span className="onboarding__option-title">{agent.label}</span>
            <span className="onboarding__option-desc">{agent.description}</span>
          </button>
        ))}
      </div>
      {form.formState.errors.aiAgents ? (
        <p className="onboarding__field-error" role="alert">
          {form.formState.errors.aiAgents.message}
        </p>
      ) : null}
      <button type="submit" className="sr-only">
        Continue
      </button>
    </FormWrapper>
  );
}
