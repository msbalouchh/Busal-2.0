"use server";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import {
  createIamAccessPolicy,
  createIamApiKey,
  createIamServiceAccount,
  createIamSession,
  enrollIamMfa,
  forcePasswordReset,
  lockIamIdentity,
  revokeAllIamSessions,
  revokeIamApiKey,
  revokeIamSession,
  unlockIamIdentity,
} from "@/services/iam.service";

export async function createIamSessionAction(input: {
  deviceName?: string;
  browser?: string;
  ipAddress?: string;
  country?: string;
}) {
  return protectedAction(PERMISSION_CODES.IAM_MANAGE_SESSIONS, async ({ platform }) =>
    createIamSession(platform, {
      userId: platform.user.id,
      businessId: platform.business.id,
      deviceName: input.deviceName,
      browser: input.browser,
      ipAddress: input.ipAddress,
      country: input.country,
    }),
  );
}

export async function revokeIamSessionAction(sessionId: string) {
  return protectedAction(PERMISSION_CODES.IAM_MANAGE_SESSIONS, async ({ platform }) =>
    revokeIamSession(platform, sessionId),
  );
}

export async function revokeAllIamSessionsAction(exceptSessionId?: string) {
  return protectedAction(PERMISSION_CODES.IAM_MANAGE_SESSIONS, async ({ platform }) =>
    revokeAllIamSessions(platform, exceptSessionId),
  );
}

export async function createIamApiKeyAction(input: {
  name: string;
  keyType: "PERSONAL" | "BUSINESS" | "MARKETPLACE";
  permissions: string[];
}) {
  return protectedAction(PERMISSION_CODES.IAM_MANAGE_API_KEYS, async ({ platform }) =>
    createIamApiKey(platform, input),
  );
}

export async function revokeIamApiKeyAction(apiKeyId: string) {
  return protectedAction(PERMISSION_CODES.IAM_MANAGE_API_KEYS, async ({ platform }) =>
    revokeIamApiKey(platform, apiKeyId),
  );
}

export async function createIamServiceAccountAction(input: {
  name: string;
  slug: string;
  description?: string;
  permissions: string[];
}) {
  return protectedAction(PERMISSION_CODES.IAM_MANAGE_SERVICE_ACCOUNTS, async ({ platform }) =>
    createIamServiceAccount(platform, input),
  );
}

export async function createIamAccessPolicyAction(input: {
  name: string;
  scope: "PLATFORM" | "BUSINESS" | "BRANCH" | "ROLE";
  rules: Record<string, unknown>;
  roleSlug?: string;
}) {
  return protectedAction(PERMISSION_CODES.IAM_MANAGE_POLICIES, async ({ platform }) =>
    createIamAccessPolicy(platform, {
      ...input,
      rules: input.rules,
    }),
  );
}

export async function enrollIamMfaAction(
  mfaType: "TOTP" | "EMAIL_OTP" | "SMS_OTP" | "BACKUP_CODE",
) {
  return protectedAction(PERMISSION_CODES.IAM_MANAGE_IDENTITIES, async ({ platform }) =>
    enrollIamMfa(platform, mfaType),
  );
}

export async function lockIamIdentityAction(identityId: string) {
  return protectedAction(PERMISSION_CODES.IAM_MANAGE_IDENTITIES, async ({ platform }) =>
    lockIamIdentity(platform, identityId),
  );
}

export async function unlockIamIdentityAction(identityId: string) {
  return protectedAction(PERMISSION_CODES.IAM_MANAGE_IDENTITIES, async ({ platform }) =>
    unlockIamIdentity(platform, identityId),
  );
}

export async function forcePasswordResetAction(identityId: string) {
  return protectedAction(PERMISSION_CODES.IAM_MANAGE_IDENTITIES, async ({ platform }) =>
    forcePasswordReset(platform, identityId),
  );
}
