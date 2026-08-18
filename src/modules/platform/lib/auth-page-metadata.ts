import "server-only";

import type { Metadata } from "next";

import { defaultMetadata, siteConfig } from "@/config/site";
import { getServerPlatformBrandingSnapshot } from "@/modules/platform/services/platform-branding.service";

export async function buildBrandedAuthMetadata(pageTitle: string): Promise<Metadata> {
  const snapshot = await getServerPlatformBrandingSnapshot();
  const { branding } = snapshot;
  const platformName = branding.platformName;
  const title = `${pageTitle} | ${platformName}`;
  const description = siteConfig.description.replace(/Busal OS/g, platformName);

  const icons: Metadata["icons"] =
    branding.isWhiteLabel && branding.faviconUrl
      ? {
          icon: [{ url: branding.faviconUrl, type: "image/png" }],
          apple: [{ url: branding.faviconUrl, type: "image/png" }],
          shortcut: [branding.faviconUrl],
        }
      : defaultMetadata.icons;

  const openGraph =
    typeof defaultMetadata.openGraph === "object" && defaultMetadata.openGraph !== null
      ? { ...defaultMetadata.openGraph, title, description, siteName: platformName }
      : { title, description, siteName: platformName };

  const twitter =
    typeof defaultMetadata.twitter === "object" && defaultMetadata.twitter !== null
      ? { ...defaultMetadata.twitter, title, description }
      : { title, description };

  return {
    title,
    description,
    icons,
    openGraph,
    twitter,
  };
}
