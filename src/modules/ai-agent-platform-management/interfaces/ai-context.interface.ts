export interface IAIContext {
  businessId: string;
  staffId: string | null;
  userId: string;
  agentId: string;
  permissions: Set<string>;
  metadata?: Record<string, unknown>;
}
