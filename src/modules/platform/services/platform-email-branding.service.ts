import "server-only";

import type { ResolvedPlatformBranding } from "@/modules/platform/types/platform-config.types";
import { resolveBrandingForBusiness } from "@/modules/platform/services/platform-branding.service";

export interface PlatformEmailBranding {
  brandName: string;
  logoUrl: string | null;
  primaryColor: string;
  footerText: string;
}

export async function resolvePlatformEmailBranding(
  businessId: string,
): Promise<PlatformEmailBranding> {
  const branding: ResolvedPlatformBranding = await resolveBrandingForBusiness(businessId);

  return {
    brandName: branding.customerFacingBrandName,
    logoUrl: branding.logoUrl,
    primaryColor: branding.primaryColor,
    footerText: branding.showBusalBranding
      ? `${branding.platformName} · Powered by Busal`
      : branding.platformName,
  };
}

export function applyEmailBrandingToHtml(html: string, branding: PlatformEmailBranding): string {
  return html
    .replace(/{{\s*brandName\s*}}/g, branding.brandName)
    .replace(/{{\s*logoUrl\s*}}/g, branding.logoUrl ?? "")
    .replace(/{{\s*primaryColor\s*}}/g, branding.primaryColor)
    .replace(/{{\s*footerText\s*}}/g, branding.footerText);
}
