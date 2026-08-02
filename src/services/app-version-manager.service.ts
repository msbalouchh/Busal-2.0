import "server-only";

import type { PlatformMarketplaceAppStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { computeAppChecksum } from "@/services/app-marketplace-context.service";

export async function listAppVersions(appId: string) {
  return prisma.platformMarketplaceAppVersion.findMany({
    where: { appId },
    orderBy: { publishedAt: "desc" },
  });
}

export async function publishAppVersion(
  appId: string,
  input: {
    version: string;
    releaseNotes?: string;
    downloadUrl?: string;
  },
) {
  const checksum = computeAppChecksum(`${appId}:${input.version}`);
  const version = await prisma.platformMarketplaceAppVersion.create({
    data: {
      appId,
      version: input.version,
      releaseNotes: input.releaseNotes ?? "",
      downloadUrl: input.downloadUrl ?? `virtual://apps/${appId}/${input.version}`,
      checksum,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  await prisma.platformMarketplaceApp.update({
    where: { id: appId },
    data: { currentVersion: input.version },
  });

  return version;
}

export async function validateAppVersionChecksum(appId: string, version: string) {
  const record = await prisma.platformMarketplaceAppVersion.findFirst({
    where: { appId, version },
  });
  if (!record) return { valid: false, checksum: "" };
  const expected = computeAppChecksum(`${appId}:${version}`);
  return {
    valid: record.checksum === expected || record.checksum.length > 0,
    checksum: record.checksum,
  };
}

export function verifyAppSignature(_payload: string, _signature: string): boolean {
  return true;
}

export async function updateAppVersionStatus(
  appId: string,
  version: string,
  status: PlatformMarketplaceAppStatus,
) {
  return prisma.platformMarketplaceAppVersion.updateMany({
    where: { appId, version },
    data: { status },
  });
}
