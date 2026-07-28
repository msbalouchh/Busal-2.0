"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { MONITORING_PLATFORM_ROUTES } from "@/modules/monitoring-platform/constants/routes";
import type {
  ErrorLogInput,
  MetricSnapshotInput,
  PerformanceLogInput,
  RegisteredHealthCheckDefinition,
  RetentionPolicyInput,
  StructuredLogInput,
  TriggerAlertInput,
} from "@/modules/monitoring-platform/types/monitoring-platform-types";
import {
  acknowledgeMonitoringAlert,
  recordErrorLog,
  recordMetricSnapshot,
  recordPerformanceLog,
  recordStructuredLog,
  registerModuleHealthCheck,
  resolveMonitoringAlert,
  triggerMonitoringAlert,
  upsertRetentionPolicy,
} from "@/services/monitoring-platform.service";

export async function registerModuleHealthCheckAction(definition: RegisteredHealthCheckDefinition) {
  return protectedAction(PERMISSION_CODES.MONITORING_PLATFORM_MANAGE, async ({ platform }) => {
    await registerModuleHealthCheck(platform.business.id, definition);
    revalidatePath(MONITORING_PLATFORM_ROUTES.health);
    revalidatePath(MONITORING_PLATFORM_ROUTES.registry);
  });
}

export async function recordMetricSnapshotAction(input: MetricSnapshotInput) {
  return protectedAction(PERMISSION_CODES.MONITORING_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await recordMetricSnapshot(platform, input);
    revalidatePath(MONITORING_PLATFORM_ROUTES.metrics);
    return result;
  });
}

export async function recordPerformanceLogAction(input: PerformanceLogInput) {
  return protectedAction(PERMISSION_CODES.MONITORING_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await recordPerformanceLog(platform, input);
    revalidatePath(MONITORING_PLATFORM_ROUTES.performance);
    return result;
  });
}

export async function recordErrorLogAction(input: ErrorLogInput) {
  return protectedAction(PERMISSION_CODES.MONITORING_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await recordErrorLog(platform, input);
    revalidatePath(MONITORING_PLATFORM_ROUTES.errors);
    return result;
  });
}

export async function recordStructuredLogAction(input: StructuredLogInput) {
  return protectedAction(PERMISSION_CODES.MONITORING_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await recordStructuredLog(platform, input);
    revalidatePath(MONITORING_PLATFORM_ROUTES.logs);
    return result;
  });
}

export async function triggerMonitoringAlertAction(input: TriggerAlertInput) {
  return protectedAction(PERMISSION_CODES.MONITORING_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await triggerMonitoringAlert(platform, input);
    revalidatePath(MONITORING_PLATFORM_ROUTES.alerts);
    revalidatePath(MONITORING_PLATFORM_ROUTES.audit);
    return result;
  });
}

export async function acknowledgeMonitoringAlertAction(alertId: string) {
  return protectedAction(PERMISSION_CODES.MONITORING_PLATFORM_MANAGE, async ({ platform }) => {
    await acknowledgeMonitoringAlert(platform, alertId);
    revalidatePath(MONITORING_PLATFORM_ROUTES.alerts);
    revalidatePath(MONITORING_PLATFORM_ROUTES.audit);
  });
}

export async function resolveMonitoringAlertAction(alertId: string) {
  return protectedAction(PERMISSION_CODES.MONITORING_PLATFORM_MANAGE, async ({ platform }) => {
    await resolveMonitoringAlert(platform, alertId);
    revalidatePath(MONITORING_PLATFORM_ROUTES.alerts);
    revalidatePath(MONITORING_PLATFORM_ROUTES.audit);
  });
}

export async function upsertRetentionPolicyAction(input: RetentionPolicyInput) {
  return protectedAction(PERMISSION_CODES.MONITORING_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await upsertRetentionPolicy(platform, input);
    revalidatePath(MONITORING_PLATFORM_ROUTES.retention);
    revalidatePath(MONITORING_PLATFORM_ROUTES.audit);
    return result;
  });
}
