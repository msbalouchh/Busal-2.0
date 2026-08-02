import type {
  ExecutionStatus,
  PlatformAutomationTriggerType,
  PlatformWorkflowStatus,
} from "@prisma/client";

export interface AutomationWorkflowRecord {
  id: string;
  name: string;
  description: string;
  status: PlatformWorkflowStatus;
  enabled: boolean;
  triggerType: PlatformAutomationTriggerType;
  triggerCount: number;
  conditionCount: number;
  actionCount: number;
  executionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationTriggerRecord {
  id: string;
  type: string;
  event: string;
  configuration: Record<string, unknown>;
  createdAt: string;
}

export interface AutomationConditionRecord {
  id: string;
  operator: string;
  field: string;
  value: string;
  configuration: Record<string, unknown>;
  createdAt: string;
}

export interface AutomationActionRecord {
  id: string;
  type: string;
  order: number;
  configuration: Record<string, unknown>;
  createdAt: string;
}

export interface AutomationExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  error: string | null;
}

export interface AutomationLogRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  executionId: string;
  level: string;
  message: string;
  timestamp: string;
}

export interface AutomationTemplateRecord {
  id: string;
  name: string;
  description: string;
  triggerType: PlatformAutomationTriggerType;
  triggerEvent: string;
  actions: string[];
}

export interface AutomationWorkflowDetailRecord extends AutomationWorkflowRecord {
  triggers: AutomationTriggerRecord[];
  conditions: AutomationConditionRecord[];
  actions: AutomationActionRecord[];
}
