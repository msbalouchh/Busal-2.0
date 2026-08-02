"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { MARKETING_NAV, MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { BRAND } from "@/modules/marketing/content/site-copy";

import "./marketing-header.css";

const NAV_ITEMS = [...MARKETING_NAV, { label: "About", href: MARKETING_ROUTES.about }] as const;

export function MarketingHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return (
    <header className={cn("mkt-header", scrolled && "mkt-header--solid")}>
      <div className="mkt-header__inner">
        <Link
          href={MARKETING_ROUTES.home}
          className="mkt-header__logo"
          aria-label={`${BRAND.name} home`}
        >
          <span className="mkt-header__logo-mark" aria-hidden="true">
            B
          </span>
          <span className="mkt-header__logo-text">{BRAND.name}</span>
        </Link>

        <nav className="mkt-header__nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("mkt-header__nav-link", isActive && "is-active")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mkt-header__actions">
          <Link href={ROUTES.login} className="mkt-header__login">
            Log in
          </Link>
          <Link href={MARKETING_ROUTES.bookDemo} className="mkt-header__cta">
            Book Demo
          </Link>
        </div>

        <button
          type="button"
          className="mkt-header__menu-btn"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="mkt-header__mobile">
          <nav className="mkt-header__mobile-nav" aria-label="Mobile">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="mkt-header__mobile-link"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mkt-header__mobile-actions">
              <Link
                href={ROUTES.login}
                className="mkt-header__mobile-login"
                onClick={() => setOpen(false)}
              >
                Log in
              </Link>
              <Link
                href={MARKETING_ROUTES.bookDemo}
                className="mkt-header__mobile-cta"
                onClick={() => setOpen(false)}
              >
                Book Demo
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
