export { AutomationPlatformNav } from "@/modules/automation-platform-management/components/automation-platform-nav";
export { AutomationDashboardPanel } from "@/modules/automation-platform-management/components/automation-dashboard-panel";
export { AutomationWorkflowListPanel } from "@/modules/automation-platform-management/components/automation-workflow-list-panel";
export { AutomationWorkflowBuilderPanel } from "@/modules/automation-platform-management/components/automation-workflow-builder-panel";
export { AutomationWorkflowDetailPanel } from "@/modules/automation-platform-management/components/automation-workflow-detail-panel";
export { AutomationExecutionsPanel } from "@/modules/automation-platform-management/components/automation-executions-panel";
export { AutomationTriggersPanel } from "@/modules/automation-platform-management/components/automation-triggers-panel";
export { AutomationActionsPanel } from "@/modules/automation-platform-management/components/automation-actions-panel";
export { AutomationTemplatesPanel } from "@/modules/automation-platform-management/components/automation-templates-panel";
export { AutomationLogsPanel } from "@/modules/automation-platform-management/components/automation-logs-panel";
export { AutomationSearchPanel } from "@/modules/automation-platform-management/components/automation-search-panel";
export {
  getAutomationPlatformContext,
  requireAutomationPlatformActionContext,
  getAutomationDashboardContext,
  getAutomationWorkflowsContext,
  getAutomationWorkflowDetailContext,
  getAutomationWorkflowBuilderContext,
  getAutomationExecutionsContext,
  getAutomationTriggersContext,
  getAutomationActionsContext,
  getAutomationTemplatesContext,
  getAutomationLogsContext,
  getAutomationSearchContext,
} from "@/modules/automation-platform-management/lib/get-automation-platform-context";
export {
  createAutomationWorkflowAction,
  updateAutomationWorkflowAction,
  deleteAutomationWorkflowAction,
  saveWorkflowBuilderAction,
  executeAutomationWorkflowAction,
  pauseAutomationWorkflowAction,
  resumeAutomationWorkflowAction,
  retryFailedExecutionsAction,
  retryAutomationExecutionAction,
  createWorkflowFromTemplateAction,
} from "@/modules/automation-platform-management/actions/automation-platform-actions";
export { AUTOMATION_PLATFORM_ROUTES } from "@/modules/automation-platform-management/constants/routes";
