import "server-only";

/** Non-inference service — no parallel AI execution. */

import { validateSkillPayload } from "@/modules/ai-skills-management/lib/ai-skills-validation";
import type {
  SkillRecord,
  SkillValidationResult,
} from "@/modules/ai-skills-management/types/ai-skills-types";

export function validateSkillInputPayload(
  skill: Pick<SkillRecord, "inputSchema">,
  input: Record<string, unknown>,
): SkillValidationResult {
  return validateSkillPayload(input, skill.inputSchema);
}

export function validateSkillOutputPayload(
  skill: Pick<SkillRecord, "outputSchema">,
  output: Record<string, unknown>,
): SkillValidationResult {
  return validateSkillPayload(output, skill.outputSchema);
}

export function assertValidSkillInput(
  skill: Pick<SkillRecord, "inputSchema" | "name">,
  input: Record<string, unknown>,
): void {
  const result = validateSkillInputPayload(skill, input);
  if (!result.valid) {
    throw new Error(`Invalid input for skill ${skill.name}: ${result.errors.join(", ")}`);
  }
}

export function assertValidSkillOutput(
  skill: Pick<SkillRecord, "outputSchema" | "name">,
  output: Record<string, unknown>,
): void {
  const result = validateSkillOutputPayload(skill, output);
  if (!result.valid) {
    throw new Error(`Invalid output for skill ${skill.name}: ${result.errors.join(", ")}`);
  }
}
