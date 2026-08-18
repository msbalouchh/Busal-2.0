import "server-only";

import type { ConfigScope, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  PLATFORM_DOMAIN_INDEX_DEFINITION_KEY,
  buildTenantSubdomainHostname,
  normalizeHostname,
} from "@/modules/platform/constants/platform-defaults";
import type {
  PlatformDomainType,
  TenantDomainResolution,
} from "@/modules/platform/types/platform-config.types";

interface DomainIndexValue {
  businessId: string;
  domainType: PlatformDomainType;
  verified: boolean;
}

async function ensureDomainIndexDefinition(): Promise<void> {
  await prisma.configSettingDefinition.upsert({
    where: { key: PLATFORM_DOMAIN_INDEX_DEFINITION_KEY },
    create: {
      key: PLATFORM_DOMAIN_INDEX_DEFINITION_KEY,
      module: "platform",
      category: "domain",
      valueType: "JSON",
      defaultValue: {},
      helpText: "Maps hostnames to tenant businesses for domain resolution.",
    },
    update: {},
  });
}

export async function upsertDomainIndexEntry(input: {
  hostname: string;
  businessId: string;
  domainType: PlatformDomainType;
  verified: boolean;
}): Promise<void> {
  const hostname = normalizeHostname(input.hostname);
  if (!hostname) {
    return;
  }

  await ensureDomainIndexDefinition();

  const value = {
    businessId: input.businessId,
    domainType: input.domainType,
    verified: input.verified,
  } satisfies DomainIndexValue;

  const existing = await prisma.configSettingValue.findFirst({
    where: {
      definitionKey: PLATFORM_DOMAIN_INDEX_DEFINITION_KEY,
      scope: "PLATFORM",
      scopeIdentifier: hostname,
      environment: "PRODUCTION",
    },
  });

  if (existing) {
    await prisma.configSettingValue.update({
      where: { id: existing.id },
      data: {
        businessId: input.businessId,
        value: value as unknown as Prisma.InputJsonValue,
      },
    });
    return;
  }

  await prisma.configSettingValue.create({
    data: {
      definitionKey: PLATFORM_DOMAIN_INDEX_DEFINITION_KEY,
      scope: "PLATFORM" as ConfigScope,
      scopeIdentifier: hostname,
      businessId: input.businessId,
      value: value as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function removeDomainIndexEntry(hostname: string): Promise<void> {
  const normalized = normalizeHostname(hostname);
  if (!normalized) {
    return;
  }

  await prisma.configSettingValue.deleteMany({
    where: {
      definitionKey: PLATFORM_DOMAIN_INDEX_DEFINITION_KEY,
      scopeIdentifier: normalized,
    },
  });
}

export async function resolveTenantFromHostname(
  host: string | null | undefined,
): Promise<TenantDomainResolution | null> {
  const hostname = normalizeHostname(host);
  if (!hostname) {
    return null;
  }

  const indexed = await prisma.configSettingValue.findFirst({
    where: {
      definitionKey: PLATFORM_DOMAIN_INDEX_DEFINITION_KEY,
      scopeIdentifier: hostname,
    },
    select: { value: true },
  });

  if (indexed?.value && typeof indexed.value === "object" && indexed.value !== null) {
    const parsed = indexed.value as unknown as DomainIndexValue;
    if (parsed.businessId && parsed.verified) {
      return {
        businessId: parsed.businessId,
        hostname,
        domainType: parsed.domainType,
        verified: parsed.verified,
      };
    }
  }

  const subdomainMatch = hostname.match(/^([a-z0-9-]+)\.getbusal\.com$/);
  if (subdomainMatch?.[1] && subdomainMatch[1] !== "www") {
    const slug = subdomainMatch[1];
    const subdomainHostname = buildTenantSubdomainHostname(slug);

    const subdomainEntry = await prisma.configSettingValue.findFirst({
      where: {
        definitionKey: PLATFORM_DOMAIN_INDEX_DEFINITION_KEY,
        scopeIdentifier: subdomainHostname,
      },
      select: { value: true },
    });

    if (subdomainEntry?.value && typeof subdomainEntry.value === "object") {
      const parsed = subdomainEntry.value as unknown as DomainIndexValue;
      if (parsed.businessId) {
        return {
          businessId: parsed.businessId,
          hostname,
          domainType: "subdomain",
          verified: parsed.verified,
        };
      }
    }
  }

  return null;
}

export async function syncDomainIndexForBusiness(input: {
  businessId: string;
  subdomain: string | null;
  customDomain: string | null;
  customDomainVerified: boolean;
}): Promise<void> {
  const existingEntries = await prisma.configSettingValue.findMany({
    where: {
      definitionKey: PLATFORM_DOMAIN_INDEX_DEFINITION_KEY,
      businessId: input.businessId,
    },
    select: { scopeIdentifier: true },
  });

  for (const entry of existingEntries) {
    await removeDomainIndexEntry(entry.scopeIdentifier);
  }

  if (input.subdomain) {
    await upsertDomainIndexEntry({
      hostname: buildTenantSubdomainHostname(input.subdomain),
      businessId: input.businessId,
      domainType: "subdomain",
      verified: true,
    });
  }

  if (input.customDomain) {
    await upsertDomainIndexEntry({
      hostname: input.customDomain,
      businessId: input.businessId,
      domainType: "custom",
      verified: input.customDomainVerified,
    });
  }
}
