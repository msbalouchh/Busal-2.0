"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { CONTROL_CENTER_PLATFORM_AUTOMATION_ROUTES } from "@/modules/control-center/automation/constants/control-center-platform-automation";
import { protectedControlCenterAction } from "@/modules/control-center/guards/control-center.guards";
import type {
  CreatePlatformAutomationInput,
  PlatformAutomationExecutionQuery,
  PlatformAutomationManagementQuery,
  UpdatePlatformAutomationInput,
} from "@/modules/control-center/automation/types/control-center-platform-automation-types";
import {
  cloneControlCenterPlatformAutomation,
  createControlCenterPlatformAutomation,
  deleteControlCenterPlatformAutomation,
  emergencyStopControlCenterPlatformAutomations,
  exportControlCenterPlatformAutomation,
  getControlCenterPlatformAutomationBundle,
  getControlCenterPlatformAutomationDetailBundle,
  getControlCenterPlatformAutomationExecutionDetail,
  pauseControlCenterPlatformAutomation,
  resumeControlCenterPlatformAutomation,
  retryControlCenterPlatformAutomationExecution,
  runControlCenterPlatformAutomation,
  updateControlCenterPlatformAutomation,
} from "@/services/control-center-platform-automation.service";

function revalidateAutomationPages() {
  revalidatePath(CONTROL_CENTER_PLATFORM_AUTOMATION_ROUTES.hub);
}

export async function refreshControlCenterPlatformAutomationAction(
  query: PlatformAutomationManagementQuery = {},
  executionQuery: PlatformAutomationExecutionQuery = {},
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_AUTOMATION, async ({
    operator,
  }) => getControlCenterPlatformAutomationBundle(operator, query, executionQuery));
}

export async function getControlCenterPlatformAutomationDetailAction(automationId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_AUTOMATION, async ({
    operator,
  }) => getControlCenterPlatformAutomationDetailBundle(operator, automationId));
}

export async function getControlCenterPlatformAutomationExecutionDetailAction(executionId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_AUTOMATION, async ({
    operator,
  }) => getControlCenterPlatformAutomationExecutionDetail(operator, executionId));
}

export async function createControlCenterPlatformAutomationAction(
  input: CreatePlatformAutomationInput,
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_AUTOMATION_CREATE, async ({
    operator,
  }) => {
    const result = await createControlCenterPlatformAutomation(operator, input);
    revalidateAutomationPages();
    return result;
  });
}

export async function updateControlCenterPlatformAutomationAction(
  automationId: string,
  input: UpdatePlatformAutomationInput,
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_AUTOMATION_EDIT, async ({
    operator,
  }) => {
    await updateControlCenterPlatformAutomation(operator, automationId, input);
    revalidateAutomationPages();
  });
}

export async function cloneControlCenterPlatformAutomationAction(automationId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_AUTOMATION_CREATE, async ({
    operator,
  }) => {
    const result = await cloneControlCenterPlatformAutomation(operator, automationId);
    revalidateAutomationPages();
    return result;
  });
}

export async function pauseControlCenterPlatformAutomationAction(automationId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_AUTOMATION_EDIT, async ({
    operator,
  }) => {
    await pauseControlCenterPlatformAutomation(operator, automationId);
    revalidateAutomationPages();
  });
}

export async function resumeControlCenterPlatformAutomationAction(automationId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_AUTOMATION_EDIT, async ({
    operator,
  }) => {
    await resumeControlCenterPlatformAutomation(operator, automationId);
    revalidateAutomationPages();
  });
}

export async function deleteControlCenterPlatformAutomationAction(automationId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_AUTOMATION_DELETE, async ({
    operator,
  }) => {
    await deleteControlCenterPlatformAutomation(operator, automationId);
    revalidateAutomationPages();
  });
}

export async function runControlCenterPlatformAutomationAction(
  automationId: string,
  input: Record<string, unknown> = {},
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_AUTOMATION_EXECUTE, async ({
    operator,
  }) => {
    const result = await runControlCenterPlatformAutomation(operator, automationId, input);
    revalidateAutomationPages();
    return result;
  });
}

export async function retryControlCenterPlatformAutomationExecutionAction(executionId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_AUTOMATION_EXECUTE, async ({
    operator,
  }) => {
    const result = await retryControlCenterPlatformAutomationExecution(operator, executionId);
    revalidateAutomationPages();
    return result;
  });
}

export async function emergencyStopControlCenterPlatformAutomationsAction() {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_AUTOMATION_EMERGENCY_STOP,
    async ({ operator }) => {
      const result = await emergencyStopControlCenterPlatformAutomations(operator);
      revalidateAutomationPages();
      return result;
    },
  );
}

export async function exportControlCenterPlatformAutomationAction(format: "csv" | "json") {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_AUTOMATION_EXPORT, async ({
    operator,
  }) => exportControlCenterPlatformAutomation(operator, format));
}
