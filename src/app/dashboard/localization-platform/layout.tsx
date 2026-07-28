import type { Metadata } from "next";

import { LocalizationPlatformNav } from "@/modules/localization-platform/components/localization-platform-nav";

export const metadata: Metadata = {
  title: "Multi-language & Localization",
};

export default function LocalizationPlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Multi-language & Localization Platform
        </h1>
        <p className="text-muted-foreground text-sm">
          Centralized localization for languages, translations, regional settings, and formatting
          across Busal OS.
        </p>
      </div>
      <LocalizationPlatformNav />
      {children}
    </div>
  );
}
