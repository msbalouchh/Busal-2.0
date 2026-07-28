import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeIamAccessPolicy,
  serializeIamApiKey,
  serializeIamDashboard,
  serializeIamIdentity,
  serializeIamIdentityProvider,
  serializeIamSecurityAuditLog,
  serializeIamServiceAccount,
  serializeIamSession,
} from "@/modules/iam/utils/iam-utils";
import {
  ensureIamDefaults,
  getIamDashboard,
  listIamAccessPolicies,
  listIamApiKeys,
  listIamIdentities,
  listIamIdentityProviders,
  listIamSecurityAuditLogs,
  listIamServiceAccounts,
  listIamSessions,
} from "@/services/iam.service";

export const getIamOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IAM_VIEW });
  await ensureIamDefaults(context.business.id);
  const dashboard = await getIamDashboard(context.business.id);

  return {
    context,
    dashboard: serializeIamDashboard(dashboard),
  };
});

export const getIamIdentitiesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IAM_VIEW });
  const identities = await listIamIdentities(context.business.id);

  return {
    context,
    identities: identities.map(serializeIamIdentity),
  };
});

export const getIamSessionsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IAM_VIEW });
  const sessions = await listIamSessions(context.business.id);

  return {
    context,
    sessions: sessions.map(serializeIamSession),
  };
});

export const getIamApiKeysContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IAM_VIEW });
  const apiKeys = await listIamApiKeys(context.business.id);

  return {
    context,
    apiKeys: apiKeys.map(serializeIamApiKey),
  };
});

export const getIamServiceAccountsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IAM_VIEW });
  const serviceAccounts = await listIamServiceAccounts(context.business.id);

  return {
    context,
    serviceAccounts: serviceAccounts.map(serializeIamServiceAccount),
  };
});

export const getIamPoliciesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IAM_VIEW });
  const policies = await listIamAccessPolicies(context.business.id);

  return {
    context,
    policies: policies.map(serializeIamAccessPolicy),
  };
});

export const getIamProvidersContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IAM_VIEW });
  const providers = await listIamIdentityProviders(context.business.id);

  return {
    context,
    providers: providers.map(serializeIamIdentityProvider),
  };
});

export const getIamSecurityContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IAM_VIEW });
  const auditLogs = await listIamSecurityAuditLogs(context.business.id, 100);

  return {
    context,
    auditLogs: auditLogs.map(serializeIamSecurityAuditLog),
  };
});
