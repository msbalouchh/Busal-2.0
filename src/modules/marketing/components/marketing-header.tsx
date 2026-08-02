"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { MARKETING_NAV, MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { BRAND } from "@/modules/marketing/content/site-copy";
import {
  MarketingPrimaryCta,
  MarketingSecondaryCta,
} from "@/modules/marketing/components/marketing-cta";

export function MarketingHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-marketing-line/80 bg-marketing-surface/80 sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href={MARKETING_ROUTES.home}
          className="flex items-center gap-2.5"
          aria-label={`${BRAND.name} home`}
        >
          <span className="bg-marketing-ink text-marketing-surface flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold">
            B
          </span>
          <span className="font-marketing-display text-marketing-ink text-lg tracking-tight">
            {BRAND.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {MARKETING_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "text-marketing-ink bg-marketing-panel font-medium"
                    : "text-marketing-muted hover:text-marketing-ink hover:bg-marketing-panel/70",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <Link
            href={ROUTES.login}
            className="text-marketing-muted hover:text-marketing-ink px-3 py-2 text-sm font-medium"
          >
            Log in
          </Link>
          <MarketingPrimaryCta className="px-4 py-2" />
        </div>

        <button
          type="button"
          className="text-marketing-ink border-marketing-line inline-flex h-10 w-10 items-center justify-center rounded-lg border lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-marketing-line bg-marketing-surface border-t lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4" aria-label="Mobile">
            {MARKETING_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-marketing-ink rounded-lg px-3 py-3 text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <MarketingSecondaryCta href={ROUTES.login}>Log in</MarketingSecondaryCta>
              <MarketingPrimaryCta />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
