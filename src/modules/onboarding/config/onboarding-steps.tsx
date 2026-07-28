import { AiIntroductionStep } from "@/modules/onboarding/components/screens/ai-introduction-step";
import { AiPersonalityStep } from "@/modules/onboarding/components/screens/ai-personality-step";
import { BusinessGoalStep } from "@/modules/onboarding/components/screens/business-goal-step";
import { BusinessInterviewStep } from "@/modules/onboarding/components/screens/business-interview-step";
import { CompleteStep } from "@/modules/onboarding/components/screens/complete-step";
import { PreparingWorkspaceStep } from "@/modules/onboarding/components/screens/preparing-workspace-step";
import { WelcomeStep } from "@/modules/onboarding/components/screens/welcome-step";
import type { OnboardingStepConfig } from "@/modules/onboarding/types/onboarding-step";

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    step: 1,
    slug: "welcome",
    title: "Welcome to Busal OS",
    description: "Your AI Operating System for Business.",
    component: WelcomeStep,
  },
  {
    step: 2,
    slug: "ai-introduction",
    title: "Meet Your AI",
    description: "Personalise your AI Business Partner",
    component: AiIntroductionStep,
  },
  {
    step: 3,
    slug: "ai-personality",
    title: "How should I work with you?",
    description:
      "Choose the personality that best matches your business. You can change this later.",
    component: AiPersonalityStep,
  },
  {
    step: 4,
    slug: "business-interview",
    title: "AI Business Interview",
    description: "Help your AI understand how your business works.",
    component: BusinessInterviewStep,
  },
  {
    step: 5,
    slug: "business-goal",
    title: "If I could achieve one thing for you in the next 90 days...",
    description: "Choose the goal that matters most right now.",
    component: BusinessGoalStep,
  },
  {
    step: 6,
    slug: "preparing-workspace",
    title: "Preparing Your Workspace",
    description:
      "I'm using everything you've shared to create a workspace tailored to your business.",
    component: PreparingWorkspaceStep,
  },
  {
    step: 7,
    slug: "complete",
    title: "Complete",
    description: "Onboarding complete",
    component: CompleteStep,
  },
];

export const ONBOARDING_TOTAL_STEPS = ONBOARDING_STEPS.length;

export function getOnboardingStepConfig(step: number): OnboardingStepConfig | undefined {
  return ONBOARDING_STEPS.find((item) => item.step === step);
}

export function getDefaultOnboardingStepConfig(): OnboardingStepConfig {
  return ONBOARDING_STEPS[0]!;
}

export function clampOnboardingStep(step: number): number {
  return Math.min(Math.max(step, 1), ONBOARDING_TOTAL_STEPS);
}
