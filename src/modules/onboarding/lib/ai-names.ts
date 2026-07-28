export const AI_NAME_PRESETS = ["Nova", "Atlas", "Echo", "Luna"] as const;

export type AiNamePreset = (typeof AI_NAME_PRESETS)[number];

export const GENERATED_AI_NAMES = [
  "Sage",
  "Orion",
  "Pixel",
  "River",
  "Astra",
  "Blaze",
  "Cedar",
  "Dusk",
  "Ember",
  "Flux",
  "Harbor",
  "Iris",
  "Jade",
  "Kai",
  "Lyra",
  "Mosaic",
  "Nimbus",
  "Onyx",
  "Prism",
  "Quill",
] as const;

export function generateAiName(exclude: string[] = []): string {
  const pool = GENERATED_AI_NAMES.filter((name) => !exclude.includes(name));

  if (pool.length === 0) {
    return GENERATED_AI_NAMES[Math.floor(Math.random() * GENERATED_AI_NAMES.length)]!;
  }

  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function isAiNamePreset(name: string): name is AiNamePreset {
  return AI_NAME_PRESETS.includes(name as AiNamePreset);
}

export function resolveInitialAiName(aiName: string | null | undefined): string | null {
  if (!aiName?.trim()) {
    return null;
  }

  const trimmed = aiName.trim();

  if (trimmed === "Busal AI") {
    return null;
  }

  return trimmed;
}
