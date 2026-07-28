import type {
  AutomationActionDefinition,
  AutomationEventDefinition,
  AutomationTriggerDefinition,
} from "@/modules/ai-automation/types/automation-types";

const events = new Map<string, AutomationEventDefinition>();
const actions = new Map<string, AutomationActionDefinition>();
const triggers = new Map<string, AutomationTriggerDefinition>();

export function registerAutomationEvent(definition: AutomationEventDefinition): void {
  events.set(definition.eventType, definition);
}

export function registerAutomationAction(definition: AutomationActionDefinition): void {
  actions.set(definition.actionType, definition);
}

export function registerAutomationTrigger(definition: AutomationTriggerDefinition): void {
  triggers.set(definition.triggerType, definition);
}

export function getAutomationEvent(eventType: string): AutomationEventDefinition | undefined {
  return events.get(eventType);
}

export function getAutomationAction(actionType: string): AutomationActionDefinition | undefined {
  return actions.get(actionType);
}

export function listAutomationEvents(): AutomationEventDefinition[] {
  return Array.from(events.values());
}

export function listAutomationActions(): AutomationActionDefinition[] {
  return Array.from(actions.values());
}

export function listAutomationTriggers(): AutomationTriggerDefinition[] {
  return Array.from(triggers.values());
}
