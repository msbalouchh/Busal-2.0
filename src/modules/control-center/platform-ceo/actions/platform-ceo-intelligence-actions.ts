"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterAction } from "@/modules/control-center/guards/control-center.guards";
import { PLATFORM_CEO_ROUTES } from "@/modules/control-center/platform-ceo/constants/platform-ceo";
import type { ExecutiveReportKind } from "@/modules/control-center/platform-ceo/types/platform-ceo-intelligence.types";
import {
  generatePlatformCeoReportForOperator,
  getPlatformCeoReportsBundle,
  runPlatformCeoExecutiveAdvisory,
} from "@/services/control-center-platform-ceo-intelligence.service";

function revalidateReportsPage() {
  revalidatePath(PLATFORM_CEO_ROUTES.reports);
  revalidatePath(PLATFORM_CEO_ROUTES.hub);
}

export async function refreshPlatformCeoReportsAction() {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_CEO, async ({ operator }) =>
    getPlatformCeoReportsBundle(operator),
  );
}

export async function generatePlatformCeoReportAction(kind: ExecutiveReportKind) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_CEO, async ({ operator }) => {
    const report = await generatePlatformCeoReportForOperator(operator, kind);
    revalidateReportsPage();
    return report;
  });
}

export async function queryPlatformCeoAdvisoryAction(question: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_CEO, async ({ operator }) =>
    runPlatformCeoExecutiveAdvisory(operator, question),
  );
}
