"use client";

import Link from "next/link";
import { Fragment } from "react";

import type { BreadcrumbItem } from "@/components/navigation/types";
import { cn } from "@/lib/utils";

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  maxItems?: number;
}

function collapseItems(items: BreadcrumbItem[], maxItems: number): BreadcrumbItem[] {
  if (items.length <= maxItems) {
    return items;
  }

  const first = items[0];
  const tail = items.slice(-(maxItems - 2));

  if (!first) {
    return tail;
  }

  return [first, { label: "…" }, ...tail];
}

export function Breadcrumb({ items, className, maxItems = 4 }: BreadcrumbProps) {
  if (items.length === 0) {
    return null;
  }

  const visibleItems = collapseItems(items, maxItems);

  return (
    <nav aria-label="Breadcrumb" className={cn("text-muted-foreground text-xs", className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;
          const isEllipsis = item.label === "…";

          return (
            <Fragment key={`${item.label}-${index}`}>
              {index > 0 ? (
                <li aria-hidden="true" className="text-muted-foreground/70">
                  /
                </li>
              ) : null}
              <li className="max-w-[12rem] truncate sm:max-w-none">
                {isEllipsis ? (
                  <span aria-hidden="true">{item.label}</span>
                ) : isLast || !item.href ? (
                  <span
                    className={cn(isLast && "text-foreground font-medium")}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link href={item.href} className="hover:text-foreground transition-colors">
                    {item.label}
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
