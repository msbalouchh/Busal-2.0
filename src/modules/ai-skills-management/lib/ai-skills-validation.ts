import type { SkillCategory, SkillStatus, Prisma } from "@prisma/client";

import type {
  BuiltInSkillTemplate,
  SkillInput,
  SkillListQuery,
  SkillRecord,
  SkillCategoryRecord,
  SkillExecutionRecord,
  SkillUpdateInput,
} from "@/modules/ai-skills-management/types/ai-skills-types";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

export function slugifySkill(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function serializeSkill(skill: {
  id: string;
  businessId: string;
  categoryId: string | null;
  name: string;
  slug: string;
  category: SkillCategory;
  description: string | null;
  version: string;
  status: SkillStatus;
  configuration: Prisma.JsonValue;
  inputSchema: Prisma.JsonValue;
  outputSchema: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  _count?: { executions: number };
}): SkillRecord {
  return {
    id: skill.id,
    businessId: skill.businessId,
    categoryId: skill.categoryId,
    name: skill.name,
    slug: skill.slug,
    category: skill.category,
    description: skill.description,
    version: skill.version,
    status: skill.status,
    configuration: jsonToRecord(skill.configuration),
    inputSchema: jsonToRecord(skill.inputSchema),
    outputSchema: jsonToRecord(skill.outputSchema),
    createdAt: skill.createdAt.toISOString(),
    updatedAt: skill.updatedAt.toISOString(),
    executionCount: skill._count?.executions ?? 0,
  };
}

export function serializeSkillCategory(
  category: {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
  },
  skillCount = 0,
): SkillCategoryRecord {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    icon: category.icon,
    color: category.color,
    skillCount,
  };
}

export function serializeSkillExecution(execution: {
  id: string;
  skillId: string;
  agentId: string | null;
  businessId: string;
  staffId: string | null;
  status: SkillExecutionRecord["status"];
  startedAt: Date | null;
  completedAt: Date | null;
  duration: number | null;
  input: Prisma.JsonValue;
  output: Prisma.JsonValue;
  error: string | null;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  skill?: { name: string };
}): SkillExecutionRecord {
  return {
    id: execution.id,
    skillId: execution.skillId,
    agentId: execution.agentId,
    businessId: execution.businessId,
    staffId: execution.staffId,
    status: execution.status,
    startedAt: execution.startedAt?.toISOString() ?? null,
    completedAt: execution.completedAt?.toISOString() ?? null,
    duration: execution.duration,
    input: jsonToRecord(execution.input),
    output: jsonToRecord(execution.output),
    error: execution.error,
    metadata: jsonToRecord(execution.metadata),
    createdAt: execution.createdAt.toISOString(),
    skillName: execution.skill?.name,
  };
}

function jsonToRecord(value: Prisma.JsonValue): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function validateSkillInput(input: SkillInput): void {
  if (!input.name?.trim()) throw new Error("Skill name is required");
  if (!input.category) throw new Error("Skill category is required");
}

export function validateSkillUpdateInput(input: SkillUpdateInput): void {
  if (input.name !== undefined && !input.name.trim()) {
    throw new Error("Skill name cannot be empty");
  }
}

export function validateSkillListQuery(query: SkillListQuery = {}): SkillListQuery {
  return {
    ...query,
    page: Math.max(1, query.page ?? 1),
    pageSize: Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE)),
  };
}

export function validateSkillPayload(
  payload: Record<string, unknown>,
  schema: Record<string, unknown>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const required = Array.isArray(schema.required) ? (schema.required as string[]) : [];

  for (const field of required) {
    if (!(field in payload) || payload[field] === undefined || payload[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export const BUILT_IN_SKILL_TEMPLATES: BuiltInSkillTemplate[] = [
  {
    slug: "summarize-business",
    name: "Summarize Business",
    category: "BUSINESS",
    description: "Template skill for summarizing business context.",
    inputSchema: { type: "object", required: ["scope"], properties: { scope: { type: "string" } } },
    outputSchema: { type: "object", properties: { summary: { type: "string" } } },
    configuration: { template: true },
  },
  {
    slug: "generate-report",
    name: "Generate Report",
    category: "REPORTING",
    description: "Template skill for generating structured reports.",
    inputSchema: {
      type: "object",
      required: ["reportType"],
      properties: { reportType: { type: "string" } },
    },
    outputSchema: { type: "object", properties: { report: { type: "object" } } },
    configuration: { template: true },
  },
  {
    slug: "analyze-sales",
    name: "Analyze Sales",
    category: "REPORTING",
    description: "Template skill for sales analysis.",
    inputSchema: { type: "object", properties: { period: { type: "string" } } },
    outputSchema: { type: "object", properties: { insights: { type: "array" } } },
    configuration: { template: true },
  },
  {
    slug: "analyze-inventory",
    name: "Analyze Inventory",
    category: "OPERATIONS",
    description: "Template skill for inventory analysis.",
    inputSchema: { type: "object", properties: { branchId: { type: "string" } } },
    outputSchema: { type: "object", properties: { insights: { type: "array" } } },
    configuration: { template: true },
  },
  {
    slug: "analyze-customers",
    name: "Analyze Customers",
    category: "CUSTOMER",
    description: "Template skill for customer analysis.",
    inputSchema: { type: "object", properties: { segment: { type: "string" } } },
    outputSchema: { type: "object", properties: { insights: { type: "array" } } },
    configuration: { template: true },
  },
  {
    slug: "analyze-reservations",
    name: "Analyze Reservations",
    category: "OPERATIONS",
    description: "Template skill for reservation analysis.",
    inputSchema: { type: "object", properties: { dateRange: { type: "string" } } },
    outputSchema: { type: "object", properties: { insights: { type: "array" } } },
    configuration: { template: true },
  },
  {
    slug: "search-data",
    name: "Search Data",
    category: "SYSTEM",
    description: "Template skill for cross-module data search.",
    inputSchema: { type: "object", required: ["query"], properties: { query: { type: "string" } } },
    outputSchema: { type: "object", properties: { results: { type: "array" } } },
    configuration: { template: true },
  },
  {
    slug: "create-recommendation",
    name: "Create Recommendation",
    category: "MARKETING",
    description: "Template skill for generating recommendations.",
    inputSchema: { type: "object", properties: { context: { type: "string" } } },
    outputSchema: { type: "object", properties: { recommendation: { type: "object" } } },
    configuration: { template: true },
  },
  {
    slug: "generate-notification",
    name: "Generate Notification",
    category: "SYSTEM",
    description: "Template skill for notification generation.",
    inputSchema: {
      type: "object",
      required: ["channel"],
      properties: { channel: { type: "string" } },
    },
    outputSchema: { type: "object", properties: { notification: { type: "object" } } },
    configuration: { template: true },
  },
  {
    slug: "generate-insight",
    name: "Generate Insight",
    category: "BUSINESS",
    description: "Template skill for insight generation.",
    inputSchema: { type: "object", properties: { topic: { type: "string" } } },
    outputSchema: { type: "object", properties: { insight: { type: "string" } } },
    configuration: { template: true },
  },
];
