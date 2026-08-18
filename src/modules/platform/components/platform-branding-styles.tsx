"use client";

import type { ResolvedPlatformBranding } from "@/modules/platform/types/platform-config.types";

interface PlatformBrandingStylesProps {
  branding: ResolvedPlatformBranding;
}

export function PlatformBrandingStyles({ branding }: PlatformBrandingStylesProps) {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          :root {
            --platform-primary: ${branding.primaryColor};
            --platform-secondary: ${branding.secondaryColor};
            --platform-accent: ${branding.accentColor};
          }
        `,
      }}
    />
  );
}
