import Link from "next/link";

import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { breadcrumbJsonLd } from "@/modules/marketing/lib/seo";
import { cn } from "@/lib/utils";

export type Crumb = { name: string; path: string };

export function MarketingBreadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const crumbs: Crumb[] =
    items[0]?.path === MARKETING_ROUTES.home
      ? items
      : [{ name: "Home", path: MARKETING_ROUTES.home }, ...items];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }}
      />
      <nav
        aria-label="Breadcrumb"
        className={cn("mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8", className)}
      >
        <ol className="text-marketing-muted flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <li key={`${crumb.path}-${crumb.name}`} className="flex items-center gap-1.5">
                {index > 0 ? (
                  <span aria-hidden="true" className="text-marketing-line">
                    /
                  </span>
                ) : null}
                {isLast ? (
                  <span aria-current="page" className="text-marketing-ink font-medium">
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    href={crumb.path}
                    className="hover:text-marketing-ink underline-offset-4 transition-colors hover:underline"
                  >
                    {crumb.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
