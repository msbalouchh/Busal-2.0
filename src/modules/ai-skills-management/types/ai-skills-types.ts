import type { SkillCategory, SkillExecutionStatus, SkillStatus } from "@prisma/client";

export interface SkillRecord {
  id: string;
  businessId: string;
  categoryId: string | null;
  name: string;
  slug: string;
  category: SkillCategory;
  description: string | null;
  version: string;
  status: SkillStatus;
  configuration: Record<string, unknown>;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  executionCount: number;
}

export interface SkillCategoryRecord {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  skillCount: number;
}

export interface SkillExecutionRecord {
  id: string;
  skillId: string;
  agentId: string | null;
  businessId: string;
  staffId: string | null;
  status: SkillExecutionStatus;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  skillName?: string;
}

export interface SkillInput {
  name: string;
  slug?: string;
  category: SkillCategory;
  description?: string | null;
  version?: string;
  status?: SkillStatus;
  configuration?: Record<string, unknown>;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  categoryId?: string | null;
}

export interface SkillUpdateInput {
  name?: string;
  category?: SkillCategory;
  description?: string | null;
  version?: string;
  status?: SkillStatus;
  configuration?: Record<string, unknown>;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  categoryId?: string | null;
}

export interface SkillListQuery {
  search?: string;
  category?: SkillCategory | "ALL";
  status?: SkillStatus | "ALL";
  page?: number;
  pageSize?: number;
}

export interface SkillListResult {
  items: SkillRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SkillExecutionInput {
  skillId: string;
  agentId?: string | null;
  input?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface SkillDashboardStats {
  totalSkills: number;
  activeSkills: number;
  draftSkills: number;
  disabledSkills: number;
  totalExecutions: number;
  failedExecutions: number;
  categories: number;
}

export interface SkillDiscoveryEntry {
  slug: string;
  name: string;
  category: SkillCategory;
  description: string;
  version: string;
  isRegistered: boolean;
  skillId?: string;
}

export interface SkillValidationResult {
  valid: boolean;
  errors: string[];
}

export interface BuiltInSkillTemplate {
  slug: string;
  name: string;
  category: SkillCategory;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  configuration: Record<string, unknown>;
}
