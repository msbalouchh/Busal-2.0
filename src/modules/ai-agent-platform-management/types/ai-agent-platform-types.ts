import type { AgentCategory, AgentStatus, ExecutionStatus } from "@prisma/client";

export interface PlatformAgentRecord {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  description: string | null;
  category: AgentCategory;
  status: AgentStatus;
  version: string;
  icon: string | null;
  color: string | null;
  configuration: Record<string, unknown>;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  toolCount?: number;
  capabilityCount?: number;
}

export interface PlatformAgentToolRecord {
  id: string;
  agentId: string;
  name: string;
  description: string | null;
  toolKey: string;
  enabled: boolean;
  configuration: Record<string, unknown>;
  createdAt: string;
}

export interface PlatformAgentCapabilityRecord {
  id: string;
  agentId: string;
  name: string;
  description: string | null;
  enabled: boolean;
}

export interface PlatformAgentExecutionRecord {
  id: string;
  agentId: string;
  businessId: string;
  staffId: string | null;
  status: ExecutionStatus;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  agentName?: string;
}

export interface PlatformAgentInput {
  name: string;
  slug?: string;
  description?: string | null;
  category?: AgentCategory;
  status?: AgentStatus;
  version?: string;
  icon?: string | null;
  color?: string | null;
  configuration?: Record<string, unknown>;
  permissions?: string[];
}

export interface PlatformAgentToolInput {
  name: string;
  description?: string | null;
  toolKey: string;
  enabled?: boolean;
  configuration?: Record<string, unknown>;
}

export interface PlatformAgentCapabilityInput {
  name: string;
  description?: string | null;
  enabled?: boolean;
}

export interface ExecuteAgentInput {
  agentId: string;
  input?: Record<string, unknown>;
}

export interface AgentListQuery {
  search?: string;
  status?: AgentStatus | "ALL";
  category?: AgentCategory | "ALL";
  page?: number;
  pageSize?: number;
}

export interface AgentListResult {
  items: PlatformAgentRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AgentDiscoveryEntry {
  slug: string;
  name: string;
  category: AgentCategory;
  status: AgentStatus;
  version: string;
  capabilities: string[];
  toolKeys: string[];
}
