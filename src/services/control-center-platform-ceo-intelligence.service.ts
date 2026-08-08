import "server-only";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import { buildPlatformCeoExecutiveContext } from "@/modules/control-center/platform-ceo/lib/build-executive-context";
import { generateExecutiveReport } from "@/modules/control-center/platform-ceo/lib/intelligence/executive-report-generator";
import {
  formatAdvisoryForChat,
  runExecutiveReasoning,
  runFullExecutiveAnalysis,
} from "@/modules/control-center/platform-ceo/lib/intelligence/executive-reasoning-engine";
import {
  listPlatformCeoReports,
  loadPlatformCeoMemory,
  savePlatformCeoReport,
} from "@/modules/control-center/platform-ceo/repository/platform-ceo.repository";
import type {
  ExecutiveAdvisoryResponse,
  ExecutiveReportKind,
  PlatformCeoExecutiveReport,
  PlatformCeoIntelligenceAnalysis,
  PlatformCeoReportsBundle,
} from "@/modules/control-center/platform-ceo/types/platform-ceo-intelligence.types";
import type { ControlCenterOperatorContext } from "@/modules/control-center/types/control-center-types";

function buildPermissions(operator: ControlCenterOperatorContext) {
  const permissions = new Set(operator.permissions);
  const hasAdmin = permissions.has(PERMISSION_CODES.CONTROL_CENTER_ADMIN);
  const canView =
    hasAdmin || hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_CEO);

  return { canView, canGenerate: canView };
}

function latestReportOfKind(
  reports: PlatformCeoExecutiveReport[],
  kind: ExecutiveReportKind,
): PlatformCeoExecutiveReport | null {
  return reports.find((report) => report.kind === kind) ?? null;
}

export async function getPlatformCeoReportsBundle(
  operator: ControlCenterOperatorContext,
): Promise<PlatformCeoReportsBundle> {
  const permissions = buildPermissions(operator);
  if (!permissions.canView) {
    throw new Error("Permission denied");
  }

  const reports = await listPlatformCeoReports(operator.userId, undefined, 100);

  return {
    permissions,
    reports,
    latestMorningBrief: latestReportOfKind(reports, "morning_brief"),
    latestWeeklyReport: latestReportOfKind(reports, "weekly_board"),
    latestMonthlyReport: latestReportOfKind(reports, "monthly_executive"),
    refreshedAt: new Date().toISOString(),
  };
}

export async function generatePlatformCeoReportForOperator(
  operator: ControlCenterOperatorContext,
  kind: ExecutiveReportKind,
): Promise<PlatformCeoExecutiveReport> {
  const permissions = buildPermissions(operator);
  if (!permissions.canGenerate) {
    throw new Error("Permission denied");
  }

  const memory = await loadPlatformCeoMemory(operator.userId);
  const context = await buildPlatformCeoExecutiveContext(operator, memory);
  const report = generateExecutiveReport(context, kind);
  return savePlatformCeoReport(operator.userId, report);
}

export async function runPlatformCeoExecutiveAdvisory(
  operator: ControlCenterOperatorContext,
  question: string,
): Promise<ExecutiveAdvisoryResponse> {
  const permissions = buildPermissions(operator);
  if (!permissions.canView) {
    throw new Error("Permission denied");
  }

  const memory = await loadPlatformCeoMemory(operator.userId);
  const context = await buildPlatformCeoExecutiveContext(operator, memory);
  return runExecutiveReasoning({ context, question });
}

export async function runPlatformCeoFullAnalysis(
  operator: ControlCenterOperatorContext,
  question?: string,
): Promise<PlatformCeoIntelligenceAnalysis> {
  const permissions = buildPermissions(operator);
  if (!permissions.canView) {
    throw new Error("Permission denied");
  }

  const memory = await loadPlatformCeoMemory(operator.userId);
  const context = await buildPlatformCeoExecutiveContext(operator, memory);
  return runFullExecutiveAnalysis({ context, question });
}

export function formatPlatformCeoAdvisoryForDisplay(
  advisory: ExecutiveAdvisoryResponse,
): string {
  return formatAdvisoryForChat(advisory);
}
