import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { discoverSkills } from "../src/services/ai-skill-discovery.service";
import {
  enableSkill,
  getSkillDashboardStats,
  listSkillCategories,
  listSkills,
  registerSkill,
  deleteSkill,
} from "../src/services/ai-skill-manager.service";
import { executeSkill, registerBuiltInSkills } from "../src/services/ai-skill-executor.service";
import { getBuiltInSkillTemplates } from "../src/services/ai-skill-registry.service";
import { getOwnedBusinessById } from "../src/services/business-profile.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

async function main() {
  console.log("AI Skills Library module structure");
  const moduleFiles = [
    "src/modules/ai-skills-management/index.ts",
    "src/modules/ai-skills-management/constants/routes.ts",
    "src/modules/ai-skills-management/types/ai-skills-types.ts",
    "src/modules/ai-skills-management/lib/get-ai-skills-context.ts",
    "src/modules/ai-skills-management/lib/ai-skills-validation.ts",
    "src/modules/ai-skills-management/actions/ai-skills-actions.ts",
    "src/modules/ai-skills-management/interfaces/skill-handler.interface.ts",
    "src/services/ai-skill-registry.service.ts",
    "src/services/ai-skill-manager.service.ts",
    "src/services/ai-skill-executor.service.ts",
    "src/services/ai-skill-validator.service.ts",
    "src/services/ai-skill-discovery.service.ts",
    "src/services/ai-skill-loader.service.ts",
    "src/services/ai-skill-config.service.ts",
    "src/services/ai-skill-permission.service.ts",
    "src/app/app/ai/skills/page.tsx",
    "src/app/app/ai/skills/registry/page.tsx",
    "src/app/app/ai/skills/categories/page.tsx",
    "src/app/app/ai/skills/executions/page.tsx",
    "src/app/app/ai/skills/search/page.tsx",
    "src/app/app/ai/skills/settings/page.tsx",
    "src/app/app/ai/skills/[skillId]/page.tsx",
    "prisma/migrations/20250731060000_ai_skills_library/migration.sql",
    "prisma/migrations/20250731060100_ai_skills_library_permissions/migration.sql",
  ];

  for (const file of moduleFiles) {
    read(file);
  }

  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(permissions.includes(PERMISSION_CODES.AI_SKILL_VIEW), "AI_SKILL_VIEW missing");
  assert(permissions.includes(PERMISSION_CODES.AI_SKILL_CREATE), "AI_SKILL_CREATE missing");
  assert(permissions.includes(PERMISSION_CODES.AI_SKILL_UPDATE), "AI_SKILL_UPDATE missing");
  assert(permissions.includes(PERMISSION_CODES.AI_SKILL_DELETE), "AI_SKILL_DELETE missing");
  assert(permissions.includes(PERMISSION_CODES.AI_SKILL_EXECUTE), "AI_SKILL_EXECUTE missing");

  const schema = read("prisma/schema.prisma");
  assert(schema.includes("model AISkill"), "AISkill model missing");
  assert(schema.includes("model AISkillExecution"), "AISkillExecution model missing");
  assert(schema.includes("model AISkillCategory"), "AISkillCategory model missing");
  assert(schema.includes("enum SkillStatus"), "SkillStatus enum missing");

  const templates = getBuiltInSkillTemplates();
  assert(templates.length >= 10, "Built-in skill templates missing");

  const business = await prisma.business.findFirst({ select: { id: true, ownerId: true } });
  assert(business, "No business found for integration test");

  const profile = await getOwnedBusinessById(business.ownerId, business.id);
  assert(profile, "Business profile missing");

  const ownerId = business.ownerId;
  const created = await registerBuiltInSkills(ownerId);
  assert(created >= 0, "Built-in skill registration failed");

  const list = await listSkills(ownerId, { pageSize: 5 });
  assert(list.total >= 1, "Skill list empty");

  const activeSkill = list.items[0];
  assert(activeSkill, "No skill available for execution test");

  if (activeSkill.status !== "ACTIVE") {
    await enableSkill(ownerId, activeSkill.id);
  }

  const execution = await executeSkill(ownerId, {
    skillId: activeSkill.id,
    input: {},
  });
  assert(execution.id, "Skill execution failed");

  const stats = await getSkillDashboardStats(ownerId);
  assert(stats.totalSkills >= 1, "Dashboard stats failed");

  const categories = await listSkillCategories(ownerId);
  assert(categories.length >= 1, "Skill categories missing");

  const discovery = await discoverSkills(ownerId);
  assert(discovery.length >= templates.length, "Skill discovery failed");

  const custom = await registerSkill(ownerId, {
    name: `Verify Skill ${Date.now()}`,
    category: "CUSTOM",
    description: "Verification skill",
    status: "DRAFT",
  });
  await deleteSkill(ownerId, custom.id);

  console.log("AI Skills Library verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
