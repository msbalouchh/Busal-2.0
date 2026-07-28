import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { AI_AGENTS_ROUTES } from "../src/modules/ai-agents/constants/routes";
import {
  DEFAULT_AGENT_SKILLS,
  DEFAULT_AGENT_TEMPLATES,
  ensureBootstrapAgentPlugins,
} from "../src/modules/ai-agents/plugins/bootstrap-agents";
import { listAgentSkills } from "../src/modules/ai-agents/registry/agent-registry";
import {
  ALL_PERMISSION_CODES,
  PERMISSION_CODES,
} from "../src/modules/authorization/constants/permissions";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";
import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import {
  assignAgentSkill,
  createAgentSchedule,
  createAiAgent,
  delegateAiAgentTask,
  ensureAgentTemplates,
  executeAiAgent,
  exportAiAgentTemplate,
  getAiAgentDashboard,
  importAiAgentTemplate,
  listAiAgentDelegations,
  listAiAgentExecutions,
  listAiAgentMemories,
  publishAiAgentVersion,
  rollbackAiAgentVersion,
  setAiAgentTesting,
  storeAiAgentMemory,
} from "../src/services/ai-agents.service";
import { mapProfileToAuthUser } from "../src/services/user.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function buildPlatformContext(businessId: string): Promise<BusinessContext> {
  const businessRecord = await prisma.business.findUnique({
    where: { id: businessId },
    include: { owner: true },
  });

  assert(businessRecord?.owner, "Business owner missing");

  const business = await getOwnedBusinessById(businessRecord.ownerId, businessId);
  assert(business, "Business profile missing");

  const user = mapProfileToAuthUser(
    businessRecord.owner.id,
    businessRecord.owner.email,
    businessRecord.owner,
    {},
  );
  const authorization = await resolveAuthorizationContext(user, business);

  return {
    user,
    business,
    branch: null,
    branchId: null,
    roleSlug: authorization.roleSlug,
    permissions: Array.from(authorization.permissions),
    authorization,
    staffSession: null,
    isOwner: authorization.isOwner,
    accessibleBusinesses: [
      { id: business.id, name: business.businessName ?? "Business", isOnboarded: true },
    ],
    accessibleBranches: [],
  };
}

async function main() {
  console.log("Module structure");
  const moduleFiles = [
    "src/modules/ai-agents/index.ts",
    "src/modules/ai-agents/constants/routes.ts",
    "src/modules/ai-agents/types/agent-types.ts",
    "src/modules/ai-agents/registry/agent-registry.ts",
    "src/modules/ai-agents/engine/agent-memory-engine.ts",
    "src/modules/ai-agents/engine/agent-execution-engine.ts",
    "src/modules/ai-agents/engine/agent-collaboration-engine.ts",
    "src/modules/ai-agents/engine/agent-scheduler-engine.ts",
    "src/modules/ai-agents/plugins/bootstrap-agents.ts",
    "src/modules/ai-agents/utils/ai-agents-utils.ts",
    "src/modules/ai-agents/lib/get-ai-agents-context.ts",
    "src/modules/ai-agents/actions/ai-agents-actions.ts",
    "src/modules/ai-agents/components/ai-agents-dashboard.tsx",
    "src/modules/ai-agents/components/ai-agents-lists.tsx",
    "src/modules/ai-agents/components/ai-agents-nav.tsx",
    "src/services/ai-agents.service.ts",
    "src/app/dashboard/ai-agents/page.tsx",
    "src/app/dashboard/ai-agents/registry/page.tsx",
    "src/app/dashboard/ai-agents/templates/page.tsx",
    "src/app/dashboard/ai-agents/skills/page.tsx",
    "src/app/dashboard/ai-agents/executions/page.tsx",
    "src/app/dashboard/ai-agents/delegations/page.tsx",
    "src/app/dashboard/ai-agents/memory/page.tsx",
    "src/app/dashboard/ai-agents/monitoring/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("AI Agents routes");
  assert(AI_AGENTS_ROUTES.overview === "/dashboard/ai-agents", "route mismatch");
  console.log("  PASS");

  console.log("Permission protected");
  const contextSource = readFileSync(
    join(root, "src/modules/ai-agents/lib/get-ai-agents-context.ts"),
    "utf8",
  );
  const actionsSource = readFileSync(
    join(root, "src/modules/ai-agents/actions/ai-agents-actions.ts"),
    "utf8",
  );
  assert(contextSource.includes("protectedPage"), "pages should use protectedPage");
  assert(contextSource.includes("PERMISSION_CODES.AI_AGENT_VIEW"), "view permission required");
  assert(actionsSource.includes("PERMISSION_CODES.AI_AGENT_DEPLOY"), "deploy permission required");
  assert(PERMISSION_CODES.AI_AGENT_ADMIN === "ai.agent.admin", "admin permission missing");
  assert(ALL_PERMISSION_CODES.includes("ai.agent.view"), "permission catalog missing");
  console.log("  PASS");

  console.log("Schema");
  const schemaSource = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schemaSource.includes("model AiAgent"), "AiAgent missing");
  assert(schemaSource.includes("model AiAgentVersion"), "AiAgentVersion missing");
  assert(schemaSource.includes("model AiAgentDelegation"), "AiAgentDelegation missing");
  console.log("  PASS");

  console.log("Plugin registry");
  ensureBootstrapAgentPlugins();
  assert(listAgentSkills().length >= 10, "bootstrap skills missing");
  assert(DEFAULT_AGENT_SKILLS.length >= 10, "default skills missing");
  assert(DEFAULT_AGENT_TEMPLATES.length >= 3, "default templates missing");
  console.log("  PASS");

  const business = await prisma.business.findFirst({ select: { id: true } });
  assert(business, "No business found");

  const platform = await buildPlatformContext(business.id);
  assert(platform.permissions.includes(PERMISSION_CODES.AI_AGENT_VIEW), "owner missing view");

  console.log("Agent templates");
  await ensureAgentTemplates(business.id);
  const templateCount = await prisma.aiAgent.count({
    where: { businessId: business.id, isTemplate: true },
  });
  assert(templateCount >= 3, "templates not seeded");
  console.log("  PASS");

  console.log("Create and publish agents");
  const suffix = Date.now().toString();
  const ceo = await createAiAgent(platform, {
    name: `CEO AI ${suffix}`,
    department: "Executive",
    role: "Chief Executive Officer",
    profile: {
      personality: "Strategic and concise",
      goals: ["Delegate effectively"],
      behaviourRules: ["Verify BusinessContext"],
      allowedTools: ["knowledge.search"],
    },
    skillIds: ["reporting", "automation"],
    scheduleType: "DAILY",
  });

  const sales = await createAiAgent(platform, {
    name: `Sales AI ${suffix}`,
    department: "Sales",
    role: "Sales Manager",
    profile: {
      personality: "Helpful and persuasive",
      goals: ["Convert leads"],
      allowedTools: ["knowledge.search"],
    },
    skillIds: ["sales", "crm"],
    scheduleType: "EVENT_DRIVEN",
  });

  await assignAgentSkill(platform, sales.agent.id, "marketing");
  await setAiAgentTesting(platform, ceo.agent.id);
  await publishAiAgentVersion(platform, ceo.agent.id, ceo.version.id);
  await publishAiAgentVersion(platform, sales.agent.id, sales.version.id);
  console.log("  PASS");

  console.log("Execute agent");
  const execution = await executeAiAgent(platform, sales.agent.id, {
    prompt: "Review latest lead activity",
  });
  assert(execution.response.length > 0, "agent response missing");
  console.log("  PASS");

  console.log("Agent collaboration");
  const delegation = await delegateAiAgentTask(platform, {
    fromAgentRecordId: ceo.agent.id,
    toAgentRecordId: sales.agent.id,
    taskSummary: "Prepare sales summary for executive review",
  });
  assert(delegation.delegationId, "delegation missing");
  console.log("  PASS");

  console.log("Agent memory");
  await storeAiAgentMemory(platform, sales.agent.id, {
    memoryType: "BUSINESS",
    memoryKey: "lead-priority",
    content: { priority: "high", segment: "enterprise" },
  });
  const memories = await listAiAgentMemories(business.id, 5);
  assert(
    memories.some((memory) => memory.memoryType === "BUSINESS"),
    "business memory missing",
  );
  console.log("  PASS");

  console.log("Agent scheduling");
  const schedule = await createAgentSchedule(platform, sales.agent.id, {
    scheduleType: "WEEKLY",
  });
  assert(schedule.scheduleType === "WEEKLY", "schedule missing");
  console.log("  PASS");

  console.log("Import and export template");
  const imported = await importAiAgentTemplate(platform, "finance-ai");
  assert(imported.id, "import failed");
  const exported = await exportAiAgentTemplate(platform, sales.agent.id);
  assert(exported.skills.includes("sales"), "export skills missing");
  console.log("  PASS");

  console.log("Version rollback");
  const versionTwo = await prisma.aiAgentVersion.create({
    data: {
      agentRecordId: sales.agent.id,
      businessId: business.id,
      versionNumber: 2,
      status: "PUBLISHED",
      personality: "Updated persona",
      goals: ["Updated goal"],
      publishedAt: new Date(),
    },
  });
  await rollbackAiAgentVersion(platform, sales.agent.id, versionTwo.id);
  const rolledBack = await prisma.aiAgent.findUnique({ where: { id: sales.agent.id } });
  assert(rolledBack?.currentVersionId === versionTwo.id, "rollback failed");
  console.log("  PASS");

  console.log("Monitoring dashboard");
  const dashboard = await getAiAgentDashboard(business.id);
  assert(dashboard.totalExecutions >= 2, "execution metrics missing");
  assert(dashboard.knowledgeUsage >= 0, "knowledge metrics missing");
  console.log("  PASS");

  console.log("Delegation history");
  const delegations = await listAiAgentDelegations(business.id, 10);
  assert(delegations.length >= 1, "delegation history missing");
  console.log("  PASS");

  console.log("Execution history");
  const executions = await listAiAgentExecutions(business.id, 10);
  assert(
    executions.some((entry) => entry.status === "COMPLETED"),
    "completed execution missing",
  );
  console.log("  PASS");

  console.log("Extensibility registry");
  const registrySource = readFileSync(
    join(root, "src/modules/ai-agents/registry/agent-registry.ts"),
    "utf8",
  );
  assert(registrySource.includes("registerAgentSkill"), "skill registration missing");
  assert(registrySource.includes("registerAgentTemplate"), "template registration missing");
  console.log("  PASS");

  console.log("\nAI Agent Platform verification passed.");
}

main()
  .catch((error) => {
    console.error("\nFIRST ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
