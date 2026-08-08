"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterAction } from "@/modules/control-center/guards/control-center.guards";
import { CONTROL_CENTER_SECURITY_ROUTES } from "@/modules/control-center/security/constants/control-center-security";
import type {
  ControlCenterSecurityBulkSessionInput,
  ControlCenterSecurityEventQuery,
  ControlCenterSecuritySessionQuery,
} from "@/modules/control-center/security/types/control-center-security-types";
import {
  bulkRevokeControlCenterSecuritySessions,
  disableControlCenterSecurityAccount,
  enableControlCenterSecurityAccount,
  exportControlCenterSecurityReport,
  getControlCenterSecurityManagementBundle,
  lockControlCenterSecurityAccount,
  queryControlCenterSecurityEvents,
  queryControlCenterSecuritySessions,
  rotateControlCenterSecurityApiKey,
  terminateControlCenterSecuritySession,
  unlockControlCenterSecurityAccount,
} from "@/services/control-center-security.service";

function revalidateSecurityPages() {
  revalidatePath(CONTROL_CENTER_SECURITY_ROUTES.hub);
}

export async function queryControlCenterSecuritySessionsAction(
  query: ControlCenterSecuritySessionQuery,
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_SECURITY, async () =>
    queryControlCenterSecuritySessions(query),
  );
}

export async function queryControlCenterSecurityEventsAction(
  query: ControlCenterSecurityEventQuery,
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_SECURITY, async () =>
    queryControlCenterSecurityEvents(query),
  );
}

export async function refreshControlCenterSecurityBundleAction(
  query: ControlCenterSecuritySessionQuery = {},
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_SECURITY, async ({
    operator,
  }) => getControlCenterSecurityManagementBundle(operator, query));
}

export async function terminateControlCenterSecuritySessionAction(sessionId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SECURITY_SESSIONS,
    async ({ operator }) => {
      await terminateControlCenterSecuritySession(operator, sessionId);
      revalidateSecurityPages();
    },
  );
}

export async function bulkRevokeControlCenterSecuritySessionsAction(
  input: ControlCenterSecurityBulkSessionInput,
) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SECURITY_SESSIONS,
    async ({ operator }) => {
      const result = await bulkRevokeControlCenterSecuritySessions(operator, input);
      revalidateSecurityPages();
      return result;
    },
  );
}

export async function lockControlCenterSecurityAccountAction(
  identityId: string,
  businessId: string,
) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SECURITY_ACCOUNTS,
    async ({ operator }) => {
      await lockControlCenterSecurityAccount(operator, identityId, businessId);
      revalidateSecurityPages();
    },
  );
}

export async function unlockControlCenterSecurityAccountAction(
  identityId: string,
  businessId: string,
) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SECURITY_ACCOUNTS,
    async ({ operator }) => {
      await unlockControlCenterSecurityAccount(operator, identityId, businessId);
      revalidateSecurityPages();
    },
  );
}

export async function disableControlCenterSecurityAccountAction(
  identityId: string,
  businessId: string,
) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SECURITY_ACCOUNTS,
    async ({ operator }) => {
      await disableControlCenterSecurityAccount(operator, identityId, businessId);
      revalidateSecurityPages();
    },
  );
}

export async function enableControlCenterSecurityAccountAction(
  identityId: string,
  businessId: string,
) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SECURITY_ACCOUNTS,
    async ({ operator }) => {
      await enableControlCenterSecurityAccount(operator, identityId, businessId);
      revalidateSecurityPages();
    },
  );
}

export async function rotateControlCenterSecurityApiKeyAction(
  apiKeyId: string,
  businessId: string,
  source: "iam" | "platform",
) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SECURITY_API_KEYS,
    async ({ operator }) => {
      const result = await rotateControlCenterSecurityApiKey(
        operator,
        apiKeyId,
        businessId,
        source,
      );
      revalidateSecurityPages();
      return result;
    },
  );
}

export async function exportControlCenterSecurityReportAction() {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_SECURITY_EXPORT, async ({
    operator,
  }) => exportControlCenterSecurityReport(operator));
}
