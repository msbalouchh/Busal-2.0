import type { ReactNode } from "react";

import { AuthLayout } from "@/modules/auth/components/auth-layout";
import { PlatformBrandingStyles } from "@/modules/platform/components/platform-branding-styles";
import { PlatformBrandingProvider } from "@/modules/platform/providers/platform-branding-provider";
import { getServerPlatformBrandingSnapshot } from "@/modules/platform/services/platform-branding.service";

interface PlatformAuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export async function PlatformAuthShell({
  title,
  description,
  children,
  footer,
}: PlatformAuthShellProps) {
  const snapshot = await getServerPlatformBrandingSnapshot();
  const branding = snapshot.branding;
  const brandedTitle = snapshot.businessId ? title.replace("Busal OS", branding.platformName) : title;
  const brandedDescription = snapshot.businessId
    ? description.replace("Busal OS", branding.platformName)
    : description;

  return (
    <PlatformBrandingProvider branding={branding}>
      <PlatformBrandingStyles branding={branding} />
      <AuthLayout
        title={brandedTitle}
        description={brandedDescription}
        footer={footer}
        branding={branding}
      >
        {children}
      </AuthLayout>
    </PlatformBrandingProvider>
  );
}
