import type { Metadata } from "next";

import { FeatureFlagsNav } from "@/modules/feature-flags/components/feature-flags-nav";

export const metadata: Metadata = {
  title: "Feature Flag Management",
};

export default function FeatureFlagsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Feature Flag Management Platform</h1>
        <p className="text-muted-foreground text-sm">
          Centralized feature flag service controlling feature availability across Busal OS.
        </p>
      </div>
      <FeatureFlagsNav />
      {children}
    </div>
  );
}
