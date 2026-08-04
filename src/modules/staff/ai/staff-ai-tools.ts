import { BUILTIN_AGENT_SLUGS } from "@/modules/ai/constants/agent-slugs";
import { PLATFORM_MODULES } from "@/modules/ai-tools/constants/platform-tools";
import { registerPlatformTool } from "@/modules/ai-tools/registry/platform-tool-registry";
import type { RegisteredPlatformTool } from "@/modules/ai-tools/types/platform-tool";
import {
  analyzePerformance,
  approveLeaveForAi,
  assignRoleForAi,
  createEmployeeForAi,
  detectAttendanceIssues,
  predictLabourDemand,
  recommendStaffing,
  scheduleShiftForAi,
} from "@/modules/staff/ai/staff-ai-context";
import { STAFF_AI_TOOL_IDS, STAFF_PERMISSIONS } from "@/modules/staff/constants/staff-status";

const STAFF_MODULE = "staff";

function defineStaffTool(
  partial: Omit<RegisteredPlatformTool, "handler" | "version" | "isEnabled" | "metadata"> & {
    metadata?: Partial<RegisteredPlatformTool["metadata"]>;
  },
  handler: RegisteredPlatformTool["handler"],
): RegisteredPlatformTool {
  return {
    ...partial,
    version: "1.0.0",
    isEnabled: true,
    metadata: {
      category: "Staff",
      tags: ["staff", "hr", "scheduling"],
      readOnly: false,
      confirmationRequired: false,
      dryRunSupported: true,
      riskLevel: "low",
      ...partial.metadata,
    },
    handler,
  };
}

const STAFF_AGENT_SLUGS = [
  BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT,
  BUILTIN_AGENT_SLUGS.OPERATIONS,
  BUILTIN_AGENT_SLUGS.ANALYTICS,
];

export const STAFF_AI_TOOLS: RegisteredPlatformTool[] = [
  defineStaffTool(
    {
      id: STAFF_AI_TOOL_IDS.CREATE_EMPLOYEE,
      name: "Create Employee",
      description: "Create a new employee profile.",
      requiredPermissions: [STAFF_PERMISSIONS.MANAGE],
      requiredModules: [STAFF_MODULE, PLATFORM_MODULES.CRM],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["firstName", "lastName", "email", "departmentId", "designationId"],
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string" },
          departmentId: { type: "string" },
          designationId: { type: "string" },
          hourlyRateCents: { type: "number" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.OPERATIONS, BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT],
      capabilityId: "capability.staff",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) =>
      createEmployeeForAi({
        firstName: typeof input.firstName === "string" ? input.firstName : "New",
        lastName: typeof input.lastName === "string" ? input.lastName : "Employee",
        email: typeof input.email === "string" ? input.email : "employee@example.com",
        departmentId: typeof input.departmentId === "string" ? input.departmentId : "dept-service",
        designationId:
          typeof input.designationId === "string" ? input.designationId : "desig-server",
        hourlyRateCents:
          typeof input.hourlyRateCents === "number" ? input.hourlyRateCents : undefined,
      }),
  ),
  defineStaffTool(
    {
      id: STAFF_AI_TOOL_IDS.ASSIGN_ROLE,
      name: "Assign Role",
      description: "Assign an RBAC role to a staff member.",
      requiredPermissions: [STAFF_PERMISSIONS.MANAGE],
      requiredModules: [STAFF_MODULE],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["staffId", "roleId", "roleName"],
        properties: {
          staffId: { type: "string" },
          roleId: { type: "string" },
          roleName: { type: "string" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: STAFF_AGENT_SLUGS,
      capabilityId: "capability.staff",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) => {
      const staffId = typeof input.staffId === "string" ? input.staffId : "";
      const roleId = typeof input.roleId === "string" ? input.roleId : "";
      const roleName = typeof input.roleName === "string" ? input.roleName : "Staff";
      return assignRoleForAi(staffId, roleId, roleName) ?? { error: "Staff member not found." };
    },
  ),
  defineStaffTool(
    {
      id: STAFF_AI_TOOL_IDS.SCHEDULE_SHIFT,
      name: "Schedule Shift",
      description: "Schedule a work shift for a staff member.",
      requiredPermissions: [STAFF_PERMISSIONS.SCHEDULE],
      requiredModules: [STAFF_MODULE],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["staffId", "shiftDate", "startTime", "endTime"],
        properties: {
          staffId: { type: "string" },
          shiftDate: { type: "string" },
          startTime: { type: "string" },
          endTime: { type: "string" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: STAFF_AGENT_SLUGS,
      capabilityId: "capability.staff",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "low" },
    },
    async (input) => {
      const staffId = typeof input.staffId === "string" ? input.staffId : "";
      const shiftDate = typeof input.shiftDate === "string" ? input.shiftDate : "2026-02-16";
      const startTime = typeof input.startTime === "string" ? input.startTime : "10:00";
      const endTime = typeof input.endTime === "string" ? input.endTime : "18:00";
      return (
        scheduleShiftForAi(staffId, shiftDate, startTime, endTime) ?? { error: "Staff not found." }
      );
    },
  ),
  defineStaffTool(
    {
      id: STAFF_AI_TOOL_IDS.APPROVE_LEAVE,
      name: "Approve Leave",
      description: "Approve a pending leave request.",
      requiredPermissions: [STAFF_PERMISSIONS.LEAVE_APPROVE],
      requiredModules: [STAFF_MODULE],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["leaveRequestId"],
        properties: { leaveRequestId: { type: "string" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: STAFF_AGENT_SLUGS,
      capabilityId: "capability.staff",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) => {
      const leaveRequestId = typeof input.leaveRequestId === "string" ? input.leaveRequestId : "";
      return approveLeaveForAi(leaveRequestId) ?? { error: "Leave request not found." };
    },
  ),
  defineStaffTool(
    {
      id: STAFF_AI_TOOL_IDS.ANALYZE_PERFORMANCE,
      name: "Analyze Performance",
      description: "Analyze staff performance reviews and trends.",
      requiredPermissions: [STAFF_PERMISSIONS.ANALYTICS_READ],
      requiredModules: [STAFF_MODULE, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        properties: { staffId: { type: "string" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.staff",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => {
      const staffId = typeof input.staffId === "string" ? input.staffId : undefined;
      return analyzePerformance(staffId);
    },
  ),
  defineStaffTool(
    {
      id: STAFF_AI_TOOL_IDS.RECOMMEND_STAFFING,
      name: "Recommend Staffing",
      description: "Recommend staffing levels for a given date.",
      requiredPermissions: [STAFF_PERMISSIONS.READ],
      requiredModules: [STAFF_MODULE, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        properties: { shiftDate: { type: "string" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: STAFF_AGENT_SLUGS,
      capabilityId: "capability.staff",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => {
      const shiftDate = typeof input.shiftDate === "string" ? input.shiftDate : "2026-02-15";
      return recommendStaffing(shiftDate);
    },
  ),
  defineStaffTool(
    {
      id: STAFF_AI_TOOL_IDS.PREDICT_LABOUR_DEMAND,
      name: "Predict Labour Demand",
      description: "Predict labour demand based on covers and schedules.",
      requiredPermissions: [STAFF_PERMISSIONS.ANALYTICS_READ],
      requiredModules: [STAFF_MODULE, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.staff",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async () => predictLabourDemand(),
  ),
  defineStaffTool(
    {
      id: STAFF_AI_TOOL_IDS.DETECT_ATTENDANCE_ISSUES,
      name: "Detect Attendance Issues",
      description: "Detect late, absent, and at-risk attendance patterns.",
      requiredPermissions: [STAFF_PERMISSIONS.READ],
      requiredModules: [STAFF_MODULE, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.staff",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async () => detectAttendanceIssues(),
  ),
];

let registered = false;

/** Registers Staff platform tools with the AI Tool Platform (mock, idempotent). */
export function registerStaffAiTools(): void {
  if (registered) {
    return;
  }

  for (const tool of STAFF_AI_TOOLS) {
    registerPlatformTool(tool);
  }

  registered = true;
}

registerStaffAiTools();
