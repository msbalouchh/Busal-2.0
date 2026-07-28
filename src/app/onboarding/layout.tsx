import type { ReactNode } from "react";

import { siteConfig } from "@/config/site";

interface OnboardingRouteLayoutProps {
  children: ReactNode;
}

export default function OnboardingRouteLayout({ children }: OnboardingRouteLayoutProps) {
  return (
    <div className="bg-muted/30 flex min-h-screen flex-col">
      <header className="bg-background/80 border-b px-4 py-4 text-center backdrop-blur-sm">
        <p className="text-primary text-lg font-semibold tracking-tight">{siteConfig.name}</p>
        <p className="text-muted-foreground mt-1 text-sm">Onboarding</p>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
