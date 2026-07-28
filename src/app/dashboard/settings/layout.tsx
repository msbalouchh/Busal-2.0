import type { Metadata } from "next";

import { SettingsEngineNav } from "@/modules/settings-engine/components/settings-engine-nav";

export const metadata: Metadata = {
  title: "Settings & Configuration",
};

export default function SettingsEngineLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings & Configuration Engine</h1>
        <p className="text-muted-foreground text-sm">
          Centralized configuration service for platform, business, branch, module, and user
          settings with inheritance, validation, versioning, and audit.
        </p>
      </div>
      <SettingsEngineNav />
      {children}
    </div>
  );
}
