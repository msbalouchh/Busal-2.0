import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { promises as dns } from "node:dns";

import { prisma } from "@/lib/prisma";
import { PLATFORM_DOMAIN_INDEX_DEFINITION_KEY, normalizeHostname } from "@/modules/platform/constants/platform-defaults";
import {
  loadPlatformConsumptionConfig,
  mergePlatformConsumptionConfig,
} from "@/modules/platform/lib/platform-settings";
import { syncDomainIndexForBusiness } from "@/modules/platform/services/platform-domain.service";

export function normalizeCustomDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

export function generateDomainVerificationToken(businessId: string, domain: string): string {
  return `busal-verify-${createHash("sha256").update(`${businessId}:${domain}:${randomBytes(8).toString("hex")}`).digest("hex").slice(0, 32)}`;
}

export function buildDnsVerificationHost(domain: string): string {
  return `_busal-verify.${domain}`;
}

export function buildHttpVerificationUrl(domain: string): string {
  return `https://${domain}/.well-known/busal-verification.txt`;
}

export async function assertDomainAvailableForBusiness(
  domain: string,
  businessId: string,
): Promise<void> {
  const normalized = normalizeCustomDomain(domain);
  if (!normalized) {
    throw new Error("Invalid domain.");
  }

  const existing = await prisma.configSettingValue.findFirst({
    where: {
      definitionKey: PLATFORM_DOMAIN_INDEX_DEFINITION_KEY,
      scopeIdentifier: normalized,
    },
    select: { businessId: true, value: true },
  });

  if (existing && existing.businessId !== businessId) {
    const value = existing.value as { verified?: boolean } | null;
    if (value?.verified) {
      throw new Error("This domain is already verified by another tenant.");
    }
    throw new Error("This domain is pending verification by another tenant.");
  }
}

async function verifyDnsRecord(domain: string, expectedToken: string): Promise<boolean> {
  try {
    const records = await dns.resolveTxt(buildDnsVerificationHost(domain));
    const flat = records.flat().join("");
    return flat.includes(expectedToken);
  } catch {
    return false;
  }
}

async function verifyHttpFile(domain: string, expectedToken: string): Promise<boolean> {
  try {
    const response = await fetch(buildHttpVerificationUrl(domain), {
      method: "GET",
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "Busal-Domain-Verification/1.0" },
    });

    if (!response.ok) {
      return false;
    }

    const body = (await response.text()).trim();
    return body === expectedToken || body.includes(expectedToken);
  } catch {
    return false;
  }
}

export async function initiateCustomDomainVerification(
  businessId: string,
  userId: string,
  domain: string,
): Promise<{
  domain: string;
  verificationToken: string;
  dnsHost: string;
  dnsValue: string;
  httpUrl: string;
}> {
  const normalized = normalizeCustomDomain(domain);
  await assertDomainAvailableForBusiness(normalized, businessId);

  const token = generateDomainVerificationToken(businessId, normalized);
  const current = await loadPlatformConsumptionConfig(businessId);

  await mergePlatformConsumptionConfig(
    businessId,
    {
      domains: {
        ...current.domains,
        customDomain: normalized,
        customDomainVerificationStatus: "pending",
        customDomainVerificationToken: token,
        customDomainVerifiedAt: null,
      },
    },
    userId,
  );

  await syncDomainIndexForBusiness({
    businessId,
    subdomain: current.domains.subdomain,
    customDomain: normalized,
    customDomainVerified: false,
  });

  return {
    domain: normalized,
    verificationToken: token,
    dnsHost: buildDnsVerificationHost(normalized),
    dnsValue: token,
    httpUrl: buildHttpVerificationUrl(normalized),
  };
}

export async function runCustomDomainVerification(
  businessId: string,
  userId: string,
): Promise<{ verified: boolean; method: "dns" | "http" | null }> {
  const config = await loadPlatformConsumptionConfig(businessId);
  const domain = config.domains.customDomain;
  const token = config.domains.customDomainVerificationToken;

  if (!domain || !token) {
    throw new Error("No custom domain pending verification.");
  }

  await assertDomainAvailableForBusiness(domain, businessId);

  const dnsVerified = await verifyDnsRecord(domain, token);
  const httpVerified = dnsVerified ? false : await verifyHttpFile(domain, token);
  const verified = dnsVerified || httpVerified;

  if (!verified) {
    await mergePlatformConsumptionConfig(
      businessId,
      {
        domains: {
          ...config.domains,
          customDomainVerificationStatus: "failed",
        },
      },
      userId,
    );

    return { verified: false, method: null };
  }

  await mergePlatformConsumptionConfig(
    businessId,
    {
      domains: {
        ...config.domains,
        customDomainVerificationStatus: "verified",
        customDomainVerifiedAt: new Date().toISOString(),
      },
    },
    userId,
  );

  await syncDomainIndexForBusiness({
    businessId,
    subdomain: config.domains.subdomain,
    customDomain: domain,
    customDomainVerified: true,
  });

  return { verified: true, method: dnsVerified ? "dns" : "http" };
}

export async function serveDomainVerificationFile(host: string): Promise<string | null> {
  const hostname = normalizeHostname(host);
  if (!hostname) {
    return null;
  }

  const entry = await prisma.configSettingValue.findFirst({
    where: {
      definitionKey: PLATFORM_DOMAIN_INDEX_DEFINITION_KEY,
      scopeIdentifier: hostname,
    },
    select: { businessId: true },
  });

  if (!entry?.businessId) {
    return null;
  }

  const config = await loadPlatformConsumptionConfig(entry.businessId);
  if (config.domains.customDomain !== hostname) {
    return null;
  }

  return config.domains.customDomainVerificationToken;
}
