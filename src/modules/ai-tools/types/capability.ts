export interface PlatformCapabilityDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  module: string;
  toolIds: string[];
  skillIds: string[];
  requiredPermissions: string[];
  supportedAgents: string[];
}

export interface CapabilityDiscoveryFilter {
  agentSlug?: string;
  permissions?: string[];
  installedModules?: string[];
  tenantId?: string | null;
  branchId?: string | null;
}
