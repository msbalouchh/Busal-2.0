import { cn } from "@/lib/utils";

import "./marketing-cover-art.css";

export type CoverArtVariant =
  | "ai"
  | "restaurant"
  | "retail"
  | "analytics"
  | "security"
  | "growth"
  | "operations"
  | "crm"
  | "product"
  | "inventory"
  | "loyalty"
  | "staff"
  | "automation"
  | "finance"
  | "support"
  | "integration";

type MarketingCoverArtProps = {
  variant: CoverArtVariant;
  gradient: string;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

function CoverPattern({ variant }: { variant: CoverArtVariant }) {
  switch (variant) {
    case "ai":
      return (
        <svg viewBox="0 0 120 80" className="mkt-cover__svg" aria-hidden="true">
          <circle cx="60" cy="40" r="22" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="60" cy="40" r="8" fill="currentColor" opacity="0.35" />
          <path d="M60 18v8M60 54v8M38 40h8M74 40h8" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "restaurant":
      return (
        <svg viewBox="0 0 120 80" className="mkt-cover__svg" aria-hidden="true">
          <rect
            x="30"
            y="28"
            width="60"
            height="28"
            rx="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M42 28V20M60 28V16M78 28V20" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "retail":
      return (
        <svg viewBox="0 0 120 80" className="mkt-cover__svg" aria-hidden="true">
          <path d="M35 32h50l-6 28H41L35 32z" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M42 32l8-12h20l8 12" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "analytics":
      return (
        <svg viewBox="0 0 120 80" className="mkt-cover__svg" aria-hidden="true">
          <path
            d="M30 56V44M45 56V36M60 56V28M75 56V40M90 56V32"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );
    case "security":
      return (
        <svg viewBox="0 0 120 80" className="mkt-cover__svg" aria-hidden="true">
          <path
            d="M60 18L38 28v18c0 14 10 22 22 26 12-4 22-12 22-26V28L60 18z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      );
    case "inventory":
      return (
        <svg viewBox="0 0 120 80" className="mkt-cover__svg" aria-hidden="true">
          <rect
            x="32"
            y="24"
            width="56"
            height="36"
            rx="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M32 36h56M48 24V18M72 24V18" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 120 80" className="mkt-cover__svg" aria-hidden="true">
          <rect
            x="28"
            y="22"
            width="64"
            height="40"
            rx="8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M40 38h40M40 48h24"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

export function MarketingCoverArt({
  variant,
  gradient,
  label,
  className,
  size = "md",
}: MarketingCoverArtProps) {
  return (
    <div
      className={cn("mkt-cover", `mkt-cover--${size}`, className)}
      style={{ background: gradient }}
    >
      <div className="mkt-cover__mesh" aria-hidden="true" />
      <div className="mkt-cover__pattern">
        <CoverPattern variant={variant} />
      </div>
      {label ? <span className="mkt-cover__label">{label}</span> : null}
    </div>
  );
}
