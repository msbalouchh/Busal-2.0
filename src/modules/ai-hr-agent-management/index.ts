export { HrAgentNav } from "@/modules/ai-hr-agent-management/components/hr-agent-nav";
export { HrAgentDashboardPanel } from "@/modules/ai-hr-agent-management/components/hr-agent-dashboard-panel";
export { HrInsightsPanel } from "@/modules/ai-hr-agent-management/components/hr-insights-panel";
export { HrRecruitmentPanel } from "@/modules/ai-hr-agent-management/components/hr-recruitment-panel";
export { HrPerformancePanel } from "@/modules/ai-hr-agent-management/components/hr-performance-panel";
export { HrAttendancePanel } from "@/modules/ai-hr-agent-management/components/hr-attendance-panel";
export { HrTrainingPanel } from "@/modules/ai-hr-agent-management/components/hr-training-panel";
export { HrRecommendationsPanel } from "@/modules/ai-hr-agent-management/components/hr-recommendations-panel";
export { HrSearchPanel } from "@/modules/ai-hr-agent-management/components/hr-search-panel";
export {
  getAiHrAgentContext,
  requireAiHrAgentActionContext,
  getHrAgentDashboardContext,
  getHrInsightsContext,
  getHrRecruitmentContext,
  getHrPerformanceContext,
  getHrAttendanceContext,
  getHrTrainingContext,
  getHrRecommendationsContext,
  getHrSearchContext,
} from "@/modules/ai-hr-agent-management/lib/get-ai-hr-agent-context";
export {
  runHrAnalysisAction,
  updateHrRecommendationStatusAction,
  dismissHrInsightAction,
} from "@/modules/ai-hr-agent-management/actions/ai-hr-agent-actions";
export { AI_HR_AGENT_ROUTES } from "@/modules/ai-hr-agent-management/constants/routes";
