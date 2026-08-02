import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const PATHS: Record<string, ReactNode> = {
  Restaurants: (
    <>
      <path d="M14 34h20" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M18 34V18c0-3 3-5 6-5s6 2 6 5v16" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M22 18h4M22 22h4" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  Retail: (
    <>
      <path d="M12 20h24l-2 14H14L12 20Z" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M16 20l2-6h12l2 6" strokeWidth="1.75" strokeLinejoin="round" />
    </>
  ),
  Hotels: (
    <>
      <path d="M10 36V16l14-8 14 8v20" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M20 36V24h8v12" strokeWidth="1.75" />
      <path d="M16 20h4M28 20h4M16 26h4M28 26h4" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  Clinics: (
    <>
      <rect x="14" y="12" width="20" height="24" rx="3" strokeWidth="1.75" />
      <path d="M24 18v12M18 24h12" strokeWidth="1.75" strokeLinecap="round" />
    </>
  ),
  Salons: (
    <>
      <circle cx="24" cy="18" r="6" strokeWidth="1.75" />
      <path d="M14 36c2-8 8-10 10-10s8 2 10 10" strokeWidth="1.75" strokeLinecap="round" />
    </>
  ),
  Gyms: (
    <>
      <path d="M10 24h6M32 24h6" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 18v12M32 18v12" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 24h16" strokeWidth="1.75" strokeLinecap="round" />
    </>
  ),
  Education: (
    <>
      <path d="M8 20l16-8 16 8-16 8-16-8Z" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M14 23v8c4 3 12 3 16 0v-8" strokeWidth="1.75" strokeLinejoin="round" />
    </>
  ),
  Construction: (
    <>
      <path d="M12 36V20l12-8 12 8v16" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M12 28h24" strokeWidth="1.5" />
      <path d="M20 36V28h8v8" strokeWidth="1.75" />
    </>
  ),
  Manufacturing: (
    <>
      <path d="M10 34V22l8-4v4l8-4v4l8-4v16H10Z" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M14 34v-6h4v6M22 34v-8h4v8M30 34v-5h4v5" strokeWidth="1.4" />
    </>
  ),
  "Real Estate": (
    <>
      <path d="M10 34V18l14-8 14 8v16H10Z" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M20 34V24h8v10" strokeWidth="1.75" />
    </>
  ),
  "Professional Services": (
    <>
      <rect x="12" y="14" width="24" height="20" rx="2" strokeWidth="1.75" />
      <path d="M18 20h12M18 25h8M18 30h10" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
};

export function IndustryMark({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn(
        "border-marketing-line from-marketing-panel to-marketing-surface flex h-14 w-14 items-center justify-center rounded-2xl border bg-gradient-to-br",
        className,
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 48 48"
        className="text-marketing-accent h-9 w-9"
        fill="none"
        stroke="currentColor"
      >
        {PATHS[name] ?? (
          <>
            <circle cx="24" cy="24" r="10" strokeWidth="1.75" />
            <path d="M24 18v12M18 24h12" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}
      </svg>
    </div>
  );
}
