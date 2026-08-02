"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Fragment } from "react";

import { cn } from "@/lib/utils";
import { CONTROL_CENTER_SECTION_LABELS } from "@/modules/control-center/constants/navigation-items";

function toLabel(segment: string): string {
  return (
    CONTROL_CENTER_SECTION_LABELS[segment] ??
    segment
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

interface ControlCenterBreadcrumbProps {
  className?: string;
}

export function ControlCenterBreadcrumb({ className }: ControlCenterBreadcrumbProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) {
    return null;
  }

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const isLast = index === segments.length - 1;

    return {
      href,
      label: toLabel(segment),
      isLast,
    };
  });

  return (
    <nav aria-label="Breadcrumb" className={cn("text-muted-foreground text-xs", className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((crumb, index) => (
          <Fragment key={crumb.href}>
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            <li>
              {crumb.isLast ? (
                <span className="text-foreground font-medium" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="hover:text-foreground transition-colors">
                  {crumb.label}
                </Link>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

export function ControlCenterPageTitle() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const current = segments[segments.length - 1];

  if (!current || current === "control-center") {
    return <h1 className="text-lg font-semibold tracking-tight">Platform Dashboard</h1>;
  }

  return <h1 className="text-lg font-semibold tracking-tight">{toLabel(current)}</h1>;
}
