import "server-only";

import type { AiAgentScheduleType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { delegateAgentTask } from "@/modules/ai-agents/engine/agent-collaboration-engine";
import {
  buildAgentExecutionContext,
  storeAgentMemory,
  type MemoryEngineDependencies,
} from "@/modules/ai-agents/engine/agent-memory-engine";
import {
  runAgentExecution,
  type AgentVersionProfile,
} from "@/modules/ai-agents/engine/agent-execution-engine";
import { computeNextRunAt } from "@/modules/ai-agents/engine/agent-scheduler-engine";
import {
  DEFAULT_AGENT_TEMPLATES,
  ensureBootstrapAgentPlugins,
} from "@/modules/ai-agents/plugins/bootstrap-agents";
import {
  getAgentTemplate,
  listAgentSkills,
  resolveSkillTools,
} from "@/modules/ai-agents/registry/agent-registry";
import type {
  AgentDashboardMetrics,
  AgentExportPayload,
  AgentMemoryEntry,
  AgentProfileInput,
} from "@/modules/ai-agents/types/agent-types";

function assertPermission(platform: BusinessContext, permission: string): void {
  if (!platform.permissions.includes(permission)) {
    throw new Error(`Permission denied: ${permission} required`);
  }
}

async function logAgentAudit(
  businessId: string,
  staffId: string | null,
  entityType: string,
  entityId: string,
  action: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await prisma.aiAgentAuditLog.create({
    data: {
      businessId,
      staffId,
      entityType,
      entityId,
      action,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

function slugifyAgentId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function buildProfileFromVersion(
  version: {
    personality: string | null;
    goals: string[];
    responsibilities: string[];
    behaviourRules: string[];
    allowedTools: string[];
    allowedKnowledgeCollections: string[];
    temperature: number;
    tokenLimit: number;
  },
  skillIds: string[],
): AgentVersionProfile {
  const skillTools = resolveSkillTools(skillIds);

  return {
    personality: version.personality,
    goals: version.goals,
    responsibilities: version.responsibilities,
    behaviourRules: version.behaviourRules,
    allowedTools: Array.from(new Set([...version.allowedTools, ...skillTools])),
    allowedKnowledgeCollections: version.allowedKnowledgeCollections,
    temperature: version.temperature,
    tokenLimit: version.tokenLimit,
    skillIds,
  };
}

function buildMemoryDependencies(): MemoryEngineDependencies {
  return {
    upsertMemory: async (input) => {
      if (input.memoryKey) {
        const existing = await prisma.aiAgentMemory.findFirst({
          where: {
            agentRecordId: input.agentRecordId,
            memoryType: input.memoryType,
            memoryKey: input.memoryKey,
          },
        });

        if (existing) {
          const updated = await prisma.aiAgentMemory.update({
            where: { id: existing.id },
            data: {
              content: input.content as Prisma.InputJsonValue,
              expiresAt: input.expiresAt ?? null,
            },
            select: { id: true },
          });
          return updated;
        }
      }

      const created = await prisma.aiAgentMemory.create({
        data: {
          agentRecordId: input.agentRecordId,
          businessId: input.businessId,
          memoryType: input.memoryType,
          memoryKey: input.memoryKey ?? null,
          content: input.content as Prisma.InputJsonValue,
          expiresAt: input.expiresAt ?? null,
        },
        select: { id: true },
      });

      return created;
    },
    listMemories: async (agentRecordId, memoryType) => {
      const memories = await prisma.aiAgentMemory.findMany({
        where: {
          agentRecordId,
          ...(memoryType ? { memoryType } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, memoryKey: true, content: true },
      });

      return memories;
    },
  };
}

export async function ensureAgentTemplates(businessId: string): Promise<void> {
  ensureBootstrapAgentPlugins();

  for (const template of DEFAULT_AGENT_TEMPLATES) {
    const existing = await prisma.aiAgent.findFirst({
      where: { businessId, agentId: template.templateId, isTemplate: true },
    });

    if (existing) {
      continue;
    }

    const agent = await prisma.aiAgent.create({
      data: {
        businessId,
        agentId: template.templateId,
        name: template.name,
        description: template.description,
        department: template.department,
        role: template.role,
        isTemplate: true,
        status: "DRAFT",
      },
    });

    const version = await prisma.aiAgentVersion.create({
      data: {
        agentRecordId: agent.id,
        businessId,
        versionNumber: 1,
        status: "DRAFT",
        personality: template.personality,
        goals: [...template.goals],
        responsibilities: [...template.responsibilities],
        behaviourRules: [...template.behaviourRules],
        allowedTools: [...template.allowedTools],
      },
    });

    await prisma.aiAgent.update({
      where: { id: agent.id },
      data: { currentVersionId: version.id },
    });

    for (const skillId of template.skills) {
      await prisma.aiAgentSkillAssignment.create({
        data: {
          agentRecordId: agent.id,
          businessId,
          skillId,
        },
      });
    }

    await prisma.aiAgentSchedule.create({
      data: {
        agentRecordId: agent.id,
        businessId,
        scheduleType: template.scheduleType,
        nextRunAt: computeNextRunAt(template.scheduleType),
      },
    });
  }
}

export async function createAiAgent(
  platform: BusinessContext,
  input: {
    name: string;
    agentId?: string;
    description?: string | null;
    avatar?: string | null;
    department?: string | null;
    role?: string | null;
    branchId?: string | null;
    isTemplate?: boolean;
    profile?: AgentProfileInput;
    skillIds?: string[];
    scheduleType?: AiAgentScheduleType;
  },
) {
  assertPermission(platform, PERMISSION_CODES.AI_AGENT_CREATE);

  const agentSlug = slugifyAgentId(input.agentId ?? input.name);
  const profile = input.profile ?? {};

  const agent = await prisma.aiAgent.create({
    data: {
      businessId: platform.business.id,
      branchId: input.branchId ?? platform.branchId,
      agentId: agentSlug,
      name: input.name,
      description: input.description ?? null,
      avatar: input.avatar ?? null,
      department: input.department ?? null,
      role: input.role ?? null,
      isTemplate: input.isTemplate ?? false,
      status: "DRAFT",
    },
  });

  const version = await prisma.aiAgentVersion.create({
    data: {
      agentRecordId: agent.id,
      businessId: platform.business.id,
      versionNumber: 1,
      status: "DRAFT",
      personality: profile.personality ?? null,
      goals: profile.goals ?? [],
      responsibilities: profile.responsibilities ?? [],
      behaviourRules: profile.behaviourRules ?? [],
      allowedTools: profile.allowedTools ?? [],
      allowedKnowledgeCollections: profile.allowedKnowledgeCollections ?? [],
      memorySettings: profile.memorySettings
        ? (profile.memorySettings as Prisma.InputJsonValue)
        : undefined,
      modelConfig: profile.modelConfig ? (profile.modelConfig as Prisma.InputJsonValue) : undefined,
      temperature: profile.temperature ?? 0.7,
      tokenLimit: profile.tokenLimit ?? 4096,
    },
  });

  await prisma.aiAgent.update({
    where: { id: agent.id },
    data: { currentVersionId: version.id },
  });

  if (input.skillIds?.length) {
    for (const skillId of input.skillIds) {
      await prisma.aiAgentSkillAssignment.create({
        data: {
          agentRecordId: agent.id,
          businessId: platform.business.id,
          skillId,
        },
      });
    }
  }

  if (input.scheduleType) {
    await prisma.aiAgentSchedule.create({
      data: {
        agentRecordId: agent.id,
        businessId: platform.business.id,
        scheduleType: input.scheduleType,
        nextRunAt: computeNextRunAt(input.scheduleType),
      },
    });
  }

  await logAgentAudit(
    platform.business.id,
    platform.staffSession?.staffId ?? null,
    "agent",
    agent.id,
    "created",
    { versionId: version.id },
  );

  return { agent, version };
}

export async function publishAiAgentVersion(
  platform: BusinessContext,
  agentRecordId: string,
  versionId: string,
) {
  assertPermission(platform, PERMISSION_CODES.AI_AGENT_DEPLOY);

  const version = await prisma.aiAgentVersion.update({
    where: { id: versionId, businessId: platform.business.id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  await prisma.aiAgent.update({
    where: { id: agentRecordId, businessId: platform.business.id },
    data: {
      status: "PUBLISHED",
      currentVersionId: version.id,
    },
  });

  await logAgentAudit(
    platform.business.id,
    platform.staffSession?.staffId ?? null,
    "agent",
    agentRecordId,
    "published",
    { versionId },
  );

  return version;
}

export async function setAiAgentTesting(
  platform: BusinessContext,
  agentRecordId: string,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.AI_AGENT_EDIT);

  await prisma.aiAgent.update({
    where: { id: agentRecordId, businessId: platform.business.id },
    data: { status: "TESTING" },
  });
}

export async function pauseAiAgent(
  platform: BusinessContext,
  agentRecordId: string,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.AI_AGENT_DISABLE);

  await prisma.aiAgent.update({
    where: { id: agentRecordId, businessId: platform.business.id },
    data: { status: "PAUSED" },
  });

  await logAgentAudit(
    platform.business.id,
    platform.staffSession?.staffId ?? null,
    "agent",
    agentRecordId,
    "paused",
  );
}

export async function archiveAiAgent(
  platform: BusinessContext,
  agentRecordId: string,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.AI_AGENT_DISABLE);

  await prisma.aiAgent.update({
    where: { id: agentRecordId, businessId: platform.business.id },
    data: { status: "ARCHIVED" },
  });

  if (platform.permissions.includes(PERMISSION_CODES.AI_AGENT_ADMIN)) {
    await prisma.aiAgentVersion.updateMany({
      where: { agentRecordId, businessId: platform.business.id, status: "PUBLISHED" },
      data: { status: "ARCHIVED", archivedAt: new Date() },
    });
  }
}

export async function rollbackAiAgentVersion(
  platform: BusinessContext,
  agentRecordId: string,
  versionId: string,
) {
  assertPermission(platform, PERMISSION_CODES.AI_AGENT_ADMIN);

  const version = await prisma.aiAgentVersion.findFirst({
    where: { id: versionId, agentRecordId, businessId: platform.business.id },
  });

  if (!version) {
    throw new Error("Version not found");
  }

  await prisma.aiAgent.update({
    where: { id: agentRecordId },
    data: { currentVersionId: version.id, status: version.status },
  });

  await logAgentAudit(
    platform.business.id,
    platform.staffSession?.staffId ?? null,
    "agent",
    agentRecordId,
    "rollback",
    { versionId },
  );

  return version;
}

export async function assignAgentSkill(
  platform: BusinessContext,
  agentRecordId: string,
  skillId: string,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.AI_AGENT_EDIT);
  ensureBootstrapAgentPlugins();

  if (!listAgentSkills().some((skill) => skill.skillId === skillId)) {
    throw new Error(`Unknown skill: ${skillId}`);
  }

  await prisma.aiAgentSkillAssignment.upsert({
    where: {
      agentRecordId_skillId: {
        agentRecordId,
        skillId,
      },
    },
    create: {
      agentRecordId,
      businessId: platform.business.id,
      skillId,
    },
    update: {},
  });
}

export async function createAgentSchedule(
  platform: BusinessContext,
  agentRecordId: string,
  input: {
    scheduleType: AiAgentScheduleType;
    cronExpression?: string | null;
    eventType?: string | null;
  },
) {
  assertPermission(platform, PERMISSION_CODES.AI_AGENT_EDIT);

  return prisma.aiAgentSchedule.create({
    data: {
      agentRecordId,
      businessId: platform.business.id,
      scheduleType: input.scheduleType,
      cronExpression: input.cronExpression ?? null,
      eventType: input.eventType ?? null,
      nextRunAt: computeNextRunAt(input.scheduleType),
    },
  });
}

export async function storeAiAgentMemory(
  platform: BusinessContext,
  agentRecordId: string,
  entry: AgentMemoryEntry,
) {
  assertPermission(platform, PERMISSION_CODES.AI_AGENT_EDIT);

  return storeAgentMemory(agentRecordId, platform.business.id, entry, buildMemoryDependencies());
}

export async function executeAiAgent(
  platform: BusinessContext,
  agentRecordId: string,
  input: Record<string, unknown> = {},
  triggerType: AiAgentScheduleType = "MANUAL",
) {
  assertPermission(platform, PERMISSION_CODES.AI_AGENT_VIEW);

  const agent = await prisma.aiAgent.findFirst({
    where: { id: agentRecordId, businessId: platform.business.id },
    include: {
      currentVersion: true,
      skillAssignments: true,
    },
  });

  if (!agent?.currentVersion) {
    throw new Error("Agent or version not found");
  }

  if (agent.status !== "PUBLISHED" && agent.status !== "TESTING") {
    throw new Error("Agent is not deployable");
  }

  const startedAt = Date.now();
  const execution = await prisma.aiAgentExecution.create({
    data: {
      agentRecordId: agent.id,
      businessId: platform.business.id,
      branchId: platform.branchId,
      versionId: agent.currentVersion.id,
      status: "RUNNING",
      triggerType,
      input: input as Prisma.InputJsonValue,
      startedAt: new Date(),
    },
  });

  try {
    const profile = buildProfileFromVersion(
      agent.currentVersion,
      agent.skillAssignments.map((assignment) => assignment.skillId),
    );
    const context = buildAgentExecutionContext(platform, input);
    const result = await runAgentExecution(
      platform,
      {
        agentRecordId: agent.id,
        agentBranchId: agent.branchId,
        profile,
        context,
      },
      buildMemoryDependencies(),
    );

    await storeAiAgentMemory(platform, agent.id, {
      memoryType: "CONVERSATION",
      content: {
        prompt: input.prompt ?? input.taskSummary ?? "manual execution",
        response: result.response,
      },
    });

    await prisma.aiAgentExecution.update({
      where: { id: execution.id },
      data: {
        status: "COMPLETED",
        output: result.structuredOutput as Prisma.InputJsonValue,
        tokensUsed: result.tokensUsed,
        costCents: result.costCents,
        knowledgeHits: result.knowledgeHits,
        toolCalls: result.toolCalls,
        automationRuns: result.automationRuns,
        durationMs: Date.now() - startedAt,
        completedAt: new Date(),
      },
    });

    return { executionId: execution.id, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent execution failed";

    await prisma.aiAgentExecution.update({
      where: { id: execution.id },
      data: {
        status: "FAILED",
        errorDetails: message,
        durationMs: Date.now() - startedAt,
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

export async function delegateAiAgentTask(
  platform: BusinessContext,
  input: {
    fromAgentRecordId: string;
    toAgentRecordId: string;
    taskSummary: string;
    parentExecutionId?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  return delegateAgentTask(platform, input, {
    ...buildMemoryDependencies(),
    createDelegation: async (request) =>
      prisma.aiAgentDelegation.create({
        data: {
          businessId: platform.business.id,
          fromAgentRecordId: request.fromAgentRecordId,
          toAgentRecordId: request.toAgentRecordId,
          parentExecutionId: request.parentExecutionId ?? null,
          taskSummary: request.taskSummary,
          status: "DELEGATED",
          metadata: request.metadata ? (request.metadata as Prisma.InputJsonValue) : undefined,
        },
        select: { id: true },
      }),
    updateDelegation: async (delegationId, update) => {
      await prisma.aiAgentDelegation.update({
        where: { id: delegationId },
        data: {
          status: update.status as "COMPLETED" | "FAILED" | "DELEGATED",
          executionId: update.executionId,
          completedAt: update.completedAt,
        },
      });
    },
    loadAgent: async (agentRecordId) => {
      const agent = await prisma.aiAgent.findFirst({
        where: { id: agentRecordId, businessId: platform.business.id },
        include: {
          currentVersion: true,
          skillAssignments: true,
        },
      });

      if (!agent?.currentVersion) {
        return null;
      }

      return {
        id: agent.id,
        branchId: agent.branchId,
        status: agent.status,
        versionId: agent.currentVersion.id,
        profile: buildProfileFromVersion(
          agent.currentVersion,
          agent.skillAssignments.map((assignment) => assignment.skillId),
        ),
      };
    },
    createExecution: async (request) => {
      const agent = await prisma.aiAgent.findFirst({
        where: { id: request.agentRecordId, businessId: platform.business.id },
        include: { currentVersion: true },
      });

      if (!agent?.currentVersion) {
        throw new Error("Agent version missing");
      }

      const execution = await prisma.aiAgentExecution.create({
        data: {
          agentRecordId: agent.id,
          businessId: platform.business.id,
          branchId: platform.branchId,
          versionId: agent.currentVersion.id,
          status: "RUNNING",
          triggerType: "MANUAL",
          input: request.input as Prisma.InputJsonValue,
          startedAt: new Date(),
        },
        select: { id: true },
      });

      return { id: execution.id };
    },
    finalizeExecution: async (executionId, update) => {
      await prisma.aiAgentExecution.update({
        where: { id: executionId },
        data: {
          status: update.status as "COMPLETED" | "FAILED",
          output: update.output ? (update.output as Prisma.InputJsonValue) : undefined,
          tokensUsed: update.tokensUsed,
          costCents: update.costCents,
          knowledgeHits: update.knowledgeHits,
          toolCalls: update.toolCalls,
          durationMs: update.durationMs,
          errorDetails: update.errorDetails ?? null,
          completedAt: new Date(),
        },
      });
    },
  });
}

export async function exportAiAgentTemplate(
  platform: BusinessContext,
  agentRecordId: string,
): Promise<AgentExportPayload> {
  assertPermission(platform, PERMISSION_CODES.AI_AGENT_VIEW);

  const agent = await prisma.aiAgent.findFirst({
    where: { id: agentRecordId, businessId: platform.business.id },
    include: {
      currentVersion: true,
      skillAssignments: true,
      schedules: { take: 1, orderBy: { createdAt: "asc" } },
    },
  });

  if (!agent?.currentVersion) {
    throw new Error("Agent not found");
  }

  return {
    templateId: agent.agentId,
    name: agent.name,
    description: agent.description,
    department: agent.department,
    role: agent.role,
    avatar: agent.avatar,
    profile: {
      personality: agent.currentVersion.personality,
      goals: agent.currentVersion.goals,
      responsibilities: agent.currentVersion.responsibilities,
      behaviourRules: agent.currentVersion.behaviourRules,
      allowedTools: agent.currentVersion.allowedTools,
      allowedKnowledgeCollections: agent.currentVersion.allowedKnowledgeCollections,
      memorySettings: agent.currentVersion.memorySettings as Record<string, unknown> | null,
      modelConfig: agent.currentVersion.modelConfig as Record<string, unknown> | null,
      temperature: agent.currentVersion.temperature,
      tokenLimit: agent.currentVersion.tokenLimit,
    },
    skills: agent.skillAssignments.map((assignment) => assignment.skillId),
    scheduleType: agent.schedules[0]?.scheduleType ?? "MANUAL",
    status: agent.status,
  };
}

export async function importAiAgentTemplate(platform: BusinessContext, templateId: string) {
  assertPermission(platform, PERMISSION_CODES.AI_AGENT_CREATE);
  ensureBootstrapAgentPlugins();

  const template = getAgentTemplate(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const existing = await prisma.aiAgent.findFirst({
    where: {
      businessId: platform.business.id,
      agentId: template.templateId,
    },
  });

  if (existing) {
    return existing;
  }

  const created = await createAiAgent(platform, {
    name: template.name,
    agentId: template.templateId,
    description: template.description,
    department: template.department,
    role: template.role,
    isTemplate: true,
    profile: {
      personality: template.personality,
      goals: template.goals,
      responsibilities: template.responsibilities,
      behaviourRules: template.behaviourRules,
      allowedTools: template.allowedTools,
    },
    skillIds: template.skills,
    scheduleType: template.scheduleType,
  });

  return created.agent;
}

export async function listAiAgents(businessId: string, templatesOnly = false) {
  return prisma.aiAgent.findMany({
    where: {
      businessId,
      isTemplate: templatesOnly,
    },
    include: { currentVersion: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAiAgentExecutions(businessId: string, limit = 50) {
  return prisma.aiAgentExecution.findMany({
    where: { businessId },
    include: { agent: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listAiAgentDelegations(businessId: string, limit = 50) {
  return prisma.aiAgentDelegation.findMany({
    where: { businessId },
    include: { fromAgent: true, toAgent: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listAiAgentMemories(businessId: string, limit = 50) {
  return prisma.aiAgentMemory.findMany({
    where: { businessId },
    include: { agent: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listAiAgentSchedules(businessId: string) {
  return prisma.aiAgentSchedule.findMany({
    where: { businessId },
    include: { agent: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAiAgentDashboard(businessId: string): Promise<AgentDashboardMetrics> {
  const [agents, executions] = await Promise.all([
    prisma.aiAgent.findMany({
      where: { businessId, isTemplate: false },
      select: { status: true },
    }),
    prisma.aiAgentExecution.findMany({
      where: { businessId },
      select: {
        status: true,
        durationMs: true,
        costCents: true,
        knowledgeHits: true,
        toolCalls: true,
        automationRuns: true,
      },
    }),
  ]);

  const totalExecutions = executions.length;
  const completed = executions.filter((execution) => execution.status === "COMPLETED").length;
  const failures = executions.filter((execution) => execution.status === "FAILED").length;
  const durations = executions
    .map((execution) => execution.durationMs)
    .filter((value): value is number => typeof value === "number");

  const averageResponseTimeMs =
    durations.length > 0
      ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
      : 0;

  const publishedAgents = agents.filter((agent) => agent.status === "PUBLISHED").length;
  const pausedAgents = agents.filter((agent) => agent.status === "PAUSED").length;
  const healthScore =
    totalExecutions > 0 ? Math.max(0, completed / totalExecutions - failures * 0.05) : 1;

  return {
    totalAgents: agents.length,
    publishedAgents,
    pausedAgents,
    healthScore,
    totalExecutions,
    successRate: totalExecutions > 0 ? completed / totalExecutions : 0,
    averageResponseTimeMs,
    totalCostCents: executions.reduce((sum, execution) => sum + execution.costCents, 0),
    knowledgeUsage: executions.reduce((sum, execution) => sum + execution.knowledgeHits, 0),
    automationUsage: executions.reduce((sum, execution) => sum + execution.automationRuns, 0),
    toolUsage: executions.reduce((sum, execution) => sum + execution.toolCalls, 0),
    errors: failures,
  };
}

export { ensureBootstrapAgentPlugins, listAgentSkills };
