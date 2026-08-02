"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { ENTERPRISE_PLATFORM_ROUTES } from "@/modules/enterprise-platform-management/constants/routes";
import { requireEnterprisePlatformActionContext } from "@/modules/enterprise-platform-management/lib/get-enterprise-platform-context";
import {
  validateOrganizationName,
  validateOrganizationSlug,
  validatePolicyName,
  validateProviderName,
} from "@/modules/enterprise-platform-management/lib/enterprise-platform-validation";
import { createOrganization } from "@/services/organization-manager.service";
import { createOrganizationUnit } from "@/services/organization-hierarchy.service";
import {
  createIdentityProvider,
  updateIdentityProviderStatus,
} from "@/services/identity-provider-manager.service";
import {
  createEnterprisePolicy,
  toggleEnterprisePolicy,
} from "@/services/enterprise-policy-manager.service";
import { updateOrganizationSettings } from "@/services/organization-manager.service";

function revalidateEnterprisePages(): void {
  for (const route of [
    ENTERPRISE_PLATFORM_ROUTES.dashboard(),
    ENTERPRISE_PLATFORM_ROUTES.organizations(),
    ENTERPRISE_PLATFORM_ROUTES.departments(),
    ENTERPRISE_PLATFORM_ROUTES.identityProviders(),
    ENTERPRISE_PLATFORM_ROUTES.policies(),
    ENTERPRISE_PLATFORM_ROUTES.compliance(),
    ENTERPRISE_PLATFORM_ROUTES.search(),
  ]) {
    revalidatePath(route);
  }
}

export async function createOrganizationAction(input: {
  name: string;
  slug: string;
  industry?: string;
}) {
  const context = await requireEnterprisePlatformActionContext(
    PERMISSION_CODES.ORGANIZATION_MANAGE,
  );
  const org = await createOrganization(context.user.id, {
    name: validateOrganizationName(input.name),
    slug: validateOrganizationSlug(input.slug),
    industry: input.industry,
  });
  revalidateEnterprisePages();
  return { id: org.id };
}

export async function createDepartmentAction(input: {
  organizationId: string;
  name: string;
  type?: string;
}) {
  const context = await requireEnterprisePlatformActionContext(
    PERMISSION_CODES.ORGANIZATION_MANAGE,
  );
  await createOrganizationUnit(context.user.id, input.organizationId, {
    name: validateOrganizationName(input.name),
    type: input.type ?? "department",
  });
  revalidateEnterprisePages();
}

export async function createIdentityProviderAction(input: {
  organizationId: string;
  name: string;
  providerType: "SAML" | "OIDC" | "LDAP" | "AZURE_AD" | "GOOGLE" | "OKTA" | "AUTH0" | "CUSTOM";
}) {
  const context = await requireEnterprisePlatformActionContext(PERMISSION_CODES.IDENTITY_MANAGE);
  await createIdentityProvider(context.user.id, {
    organizationId: input.organizationId,
    name: validateProviderName(input.name),
    providerType: input.providerType,
    configuration: { framework: input.providerType.toLowerCase(), simulated: true },
  });
  revalidateEnterprisePages();
}

export async function activateIdentityProviderAction(providerId: string) {
  const context = await requireEnterprisePlatformActionContext(PERMISSION_CODES.IDENTITY_MANAGE);
  await updateIdentityProviderStatus(context.user.id, providerId, "ACTIVE");
  revalidateEnterprisePages();
}

export async function createPolicyAction(input: {
  organizationId: string;
  name: string;
  category: "SECURITY" | "ACCESS" | "SESSION" | "PASSWORD" | "DEVICE" | "COMPLIANCE";
}) {
  const context = await requireEnterprisePlatformActionContext(PERMISSION_CODES.POLICY_MANAGE);
  await createEnterprisePolicy(context.user.id, {
    organizationId: input.organizationId,
    name: validatePolicyName(input.name),
    category: input.category,
  });
  revalidateEnterprisePages();
}

export async function togglePolicyAction(policyId: string, enabled: boolean) {
  const context = await requireEnterprisePlatformActionContext(PERMISSION_CODES.POLICY_MANAGE);
  await toggleEnterprisePolicy(context.user.id, policyId, enabled);
  revalidateEnterprisePages();
}

export async function updateOrganizationSettingsAction(
  organizationId: string,
  settings: Record<string, unknown>,
) {
  const context = await requireEnterprisePlatformActionContext(PERMISSION_CODES.ENTERPRISE_MANAGE);
  await updateOrganizationSettings(context.user.id, organizationId, settings);
  revalidatePath(ENTERPRISE_PLATFORM_ROUTES.settings(organizationId));
  revalidateEnterprisePages();
}
