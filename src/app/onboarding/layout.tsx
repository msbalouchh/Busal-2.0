import type { ReactNode } from "react";

import { BusalLogo } from "@/components/brand/busal-logo";

interface OnboardingRouteLayoutProps {
  children: ReactNode;
}

export default function OnboardingRouteLayout({ children }: OnboardingRouteLayoutProps) {
  return (
    <div className="bg-muted/30 flex min-h-screen flex-col">
      <header className="bg-background/80 border-b px-4 py-4 text-center backdrop-blur-sm">
        <div className="flex justify-center">
          <BusalLogo height={44} priority />
        </div>
        <p className="text-muted-foreground mt-2 text-sm">Onboarding</p>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
