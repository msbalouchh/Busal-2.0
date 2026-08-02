import "server-only";

import { updateSkill } from "@/services/ai-skill-manager.service";

export async function updateSkillConfiguration(
  ownerId: string,
  skillId: string,
  configuration: Record<string, unknown>,
  staffId?: string | null,
) {
  return updateSkill(ownerId, skillId, { configuration }, staffId);
}

export async function mergeSkillConfiguration(
  ownerId: string,
  skillId: string,
  patch: Record<string, unknown>,
  staffId?: string | null,
) {
  const { getSkill } = await import("@/services/ai-skill-manager.service");
  const skill = await getSkill(ownerId, skillId);
  return updateSkill(
    ownerId,
    skillId,
    { configuration: { ...skill.configuration, ...patch } },
    staffId,
  );
}

export async function updateSkillSchemas(
  ownerId: string,
  skillId: string,
  inputSchema: Record<string, unknown>,
  outputSchema: Record<string, unknown>,
  staffId?: string | null,
) {
  return updateSkill(ownerId, skillId, { inputSchema, outputSchema }, staffId);
}
