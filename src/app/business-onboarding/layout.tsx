import type { ReactNode } from "react";

export default function BusinessOnboardingLayout({ children }: { children: ReactNode }) {
  return <div className="bg-background min-h-screen">{children}</div>;
}
