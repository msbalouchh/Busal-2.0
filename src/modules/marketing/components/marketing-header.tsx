"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { MARKETING_NAV, MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { BRAND } from "@/modules/marketing/content/site-copy";
import {
  MarketingPrimaryCta,
  MarketingSecondaryCta,
} from "@/modules/marketing/components/marketing-cta";

const HOME_NAV = [...MARKETING_NAV, { label: "About", href: MARKETING_ROUTES.about }] as const;

export function MarketingHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navItems = isHome ? HOME_NAV : MARKETING_NAV;

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300",
        isHome
          ? scrolled
            ? "border-b border-white/10 bg-[#0B1020]/75 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
          : "border-marketing-line/80 bg-marketing-surface/80 border-b backdrop-blur-xl",
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-16 w-full items-center justify-between gap-3 sm:gap-4",
          isHome
            ? "max-w-[1440px] px-[clamp(1.25rem,3.5vw,2.5rem)]"
            : "max-w-6xl px-4 sm:px-6 lg:px-8",
        )}
      >
        <Link
          href={MARKETING_ROUTES.home}
          className="flex items-center gap-2.5"
          aria-label={`${BRAND.name} home`}
        >
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold",
              isHome
                ? "bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] text-white"
                : "bg-marketing-ink text-marketing-surface",
            )}
          >
            B
          </span>
          <span
            className={cn(
              "font-marketing-display text-lg tracking-tight",
              isHome ? "text-white" : "text-marketing-ink",
            )}
          >
            {BRAND.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm transition-colors",
                  isHome
                    ? isActive
                      ? "bg-white/10 font-medium text-white"
                      : "text-white/65 hover:bg-white/5 hover:text-white"
                    : isActive
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
            className={cn(
              "px-3 py-2 text-sm font-medium",
              isHome
                ? "text-white/70 hover:text-white"
                : "text-marketing-muted hover:text-marketing-ink",
            )}
          >
            Log in
          </Link>
          {isHome ? (
            <Link
              href={MARKETING_ROUTES.bookDemo}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#6366F1] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(59,130,246,0.8)] transition hover:brightness-110"
            >
              Book Demo
            </Link>
          ) : (
            <MarketingPrimaryCta className="px-4 py-2" />
          )}
        </div>

        <button
          type="button"
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-lg border lg:hidden",
            isHome ? "border-white/15 text-white" : "text-marketing-ink border-marketing-line",
          )}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div
          className={cn(
            "border-t lg:hidden",
            isHome
              ? "border-white/10 bg-[#0B1020]/95"
              : "border-marketing-line bg-marketing-surface",
          )}
        >
          <nav
            className={cn(
              "mx-auto flex flex-col gap-1 px-4 py-4",
              isHome ? "max-w-[1440px]" : "max-w-6xl",
            )}
            aria-label="Mobile"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-3 text-sm font-medium",
                  isHome ? "text-white" : "text-marketing-ink",
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              {isHome ? (
                <>
                  <Link
                    href={ROUTES.login}
                    className="rounded-xl border border-white/15 px-4 py-2.5 text-center text-sm font-semibold text-white"
                    onClick={() => setOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href={MARKETING_ROUTES.bookDemo}
                    className="rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#6366F1] px-4 py-2.5 text-center text-sm font-semibold text-white"
                    onClick={() => setOpen(false)}
                  >
                    Book Demo
                  </Link>
                </>
              ) : (
                <>
                  <MarketingSecondaryCta href={ROUTES.login}>Log in</MarketingSecondaryCta>
                  <MarketingPrimaryCta />
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
