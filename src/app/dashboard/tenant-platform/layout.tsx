import type { Metadata } from "next";

import { TenantPlatformNav } from "@/modules/tenant-platform/components/tenant-platform-nav";

export const metadata: Metadata = {
  title: "Tenant Administration",
};

export default function TenantPlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tenant Administration Platform</h1>
        <p className="text-muted-foreground text-sm">
          Central tenant management for lifecycle, resources, security, and analytics across Busal
          OS.
        </p>
      </div>
      <TenantPlatformNav />
      {children}
    </div>
  );
}
