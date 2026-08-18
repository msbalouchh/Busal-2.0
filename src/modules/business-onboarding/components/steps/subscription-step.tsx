"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormWrapper } from "@/components/common/form-wrapper";
import { SUBSCRIPTION_PLANS } from "@/modules/business-onboarding/constants/onboarding-options";
import { WORKSPACE_FORM_IDS } from "@/modules/business-onboarding/constants/workspace-steps";
import {
  subscriptionSchema,
  type SubscriptionValues,
} from "@/modules/business-onboarding/schemas/onboarding.schema";
import { useWorkspaceWizardStore } from "@/modules/business-onboarding/store/onboarding.store";
import { cn } from "@/lib/utils";

interface SubscriptionStepProps {
  onContinue: () => void;
}

export function SubscriptionStep({ onContinue }: SubscriptionStepProps) {
  const data = useWorkspaceWizardStore();

  const form = useForm<SubscriptionValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: { subscriptionPlan: data.subscriptionPlan || "trial" },
  });

  const selected = form.watch("subscriptionPlan");

  return (
    <FormWrapper
      id={WORKSPACE_FORM_IDS.subscription}
      form={form}
      className="onboarding__form"
      onSubmit={(values) => {
        data.patch(values);
        onContinue();
      }}
    >
      <p className="text-sm text-white/55">
        Select a plan for your workspace. All plans include a 15-day free trial. A payment method is
        required before trial activation — you will not be charged until the trial ends.
      </p>
      <div className="onboarding__plan-grid">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <button
            key={plan.id}
            type="button"
            className={cn("onboarding__plan", selected === plan.id && "is-selected")}
            onClick={() => form.setValue("subscriptionPlan", plan.id, { shouldValidate: true })}
          >
            <span className="onboarding__plan-price">{plan.price}</span>
            <span className="onboarding__plan-label">{plan.label}</span>
            <span className="onboarding__plan-desc">{plan.description}</span>
          </button>
        ))}
      </div>
      <button type="submit" className="sr-only">
        Continue
      </button>
    </FormWrapper>
  );
}
