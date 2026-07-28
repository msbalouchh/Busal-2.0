export const AI_PERSONALITY_OPTIONS = [
  {
    value: "Professional",
    label: "Professional",
    description: "Clear, concise, and business-focused.",
  },
  {
    value: "Friendly",
    label: "Friendly",
    description: "Warm, approachable, and conversational.",
  },
  {
    value: "Luxury",
    label: "Luxury",
    description: "Polished, refined, and premium in tone.",
  },
  {
    value: "Sales Expert",
    label: "Sales Expert",
    description: "Persuasive, proactive, and results-driven.",
  },
  {
    value: "Restaurant Expert",
    label: "Restaurant Expert",
    description: "Hospitality-focused with operational know-how.",
  },
  {
    value: "Healthcare Expert",
    label: "Healthcare Expert",
    description: "Calm, precise, and compliance-aware.",
  },
  {
    value: "Retail Expert",
    label: "Retail Expert",
    description: "Customer-first with merchandising insight.",
  },
] as const;

export type AiPersonalityValue = (typeof AI_PERSONALITY_OPTIONS)[number]["value"];

export const AI_PERSONALITY_VALUES = AI_PERSONALITY_OPTIONS.map(
  (option) => option.value,
) as AiPersonalityValue[];

export function isAiPersonalityValue(value: string): value is AiPersonalityValue {
  return AI_PERSONALITY_VALUES.includes(value as AiPersonalityValue);
}

export function resolveInitialAiPersonality(
  aiPersonality: string | null | undefined,
): AiPersonalityValue | null {
  if (!aiPersonality?.trim()) {
    return null;
  }

  const trimmed = aiPersonality.trim();

  return isAiPersonalityValue(trimmed) ? trimmed : null;
}
