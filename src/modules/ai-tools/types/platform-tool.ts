/** JSON-schema-like property map for mock tool I/O (no external validator dependency). */
export interface PlatformJsonSchema {
  type: "object" | "string" | "number" | "boolean" | "array";
  properties?: Record<string, PlatformJsonSchema>;
  required?: string[];
  items?: PlatformJsonSchema;
  description?: string;
}

export type TenantScopeRequirement = "required" | "optional" | "none";
export type BranchScopeRequirement = "required" | "optional" | "none";

export interface PlatformToolDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  requiredPermissions: string[];
  requiredModules: string[];
  requiredTenantScope: TenantScopeRequirement;
  requiredBranchScope: BranchScopeRequirement;
  inputSchema: PlatformJsonSchema;
  outputSchema: PlatformJsonSchema;
  supportedAgents: string[];
  capabilityId: string;
  skillIds: string[];
  isEnabled: boolean;
  metadata: PlatformToolMetadata;
}

export interface PlatformToolMetadata {
  category: string;
  tags: string[];
  readOnly: boolean;
  confirmationRequired: boolean;
  dryRunSupported: boolean;
  riskLevel: "low" | "medium" | "high";
  documentationUrl?: string;
}

export interface PlatformToolVersion {
  toolId: string;
  version: string;
  changelog: string;
  deprecated: boolean;
  releasedAt: string;
}

export interface PlatformToolHandler {
  (
    input: Record<string, unknown>,
    context: PlatformExecutionContext,
  ): Promise<Record<string, unknown>>;
}

export interface RegisteredPlatformTool extends PlatformToolDefinition {
  handler: PlatformToolHandler;
}

export interface PlatformExecutionContext {
  agentSlug: string;
  userId: string;
  tenantId: string | null;
  workspaceId: string | null;
  businessId: string | null;
  branchId: string | null;
  permissions: ReadonlySet<string>;
  installedModules: ReadonlySet<string>;
}

export interface PlatformToolExecutionRequest {
  toolId: string;
  input: Record<string, unknown>;
  context: PlatformExecutionContext;
  dryRun?: boolean;
}

export interface PlatformToolExecutionResult {
  toolId: string;
  success: boolean;
  output: Record<string, unknown> | null;
  error: string | null;
  dryRun: boolean;
  executionTimeMs: number;
  version: string;
}

export interface DiscoveredPlatformTool {
  id: string;
  name: string;
  description: string;
  version: string;
  requiredPermissions: string[];
  requiredModules: string[];
  supportedAgents: string[];
  metadata: PlatformToolMetadata;
}
