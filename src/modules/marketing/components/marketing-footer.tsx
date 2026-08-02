"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NewsletterForm } from "@/modules/marketing/components/newsletter-form";
import { MARKETING_FOOTER, MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { BRAND, SOCIAL_LINKS } from "@/modules/marketing/content/site-copy";

const FOOTER_COLUMNS = [
  ["Product", MARKETING_FOOTER.product],
  ["Company", MARKETING_FOOTER.company],
  ["Resources", MARKETING_FOOTER.resources],
  ["Legal", MARKETING_FOOTER.legal],
] as const;

function HomeFooter() {
  return (
    <footer className="home-footer">
      <div className="home-container home-footer__main">
        <div className="home-footer__grid">
          <div className="home-footer__brand">
            <Link href={MARKETING_ROUTES.home} className="home-footer__logo">
              <span className="home-footer__logo-mark">B</span>
              <span className="home-footer__logo-text">{BRAND.name}</span>
            </Link>
            <p className="home-footer__tagline">{BRAND.tagline}</p>
            <div className="home-footer__newsletter">
              <NewsletterForm />
            </div>
            <ul className="home-footer__social" aria-label="Social links">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="home-footer__columns">
            {FOOTER_COLUMNS.map(([title, links]) => (
              <div key={title}>
                <p className="home-footer__column-title">{title}</p>
                <ul className="home-footer__links">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="home-footer__bar">
        <div className="home-container home-footer__bar-inner">
          <p>© {new Date().getFullYear()} Busal OS · getbusal.com · London, United Kingdom</p>
          <div className="home-footer__bar-links">
            <Link href={MARKETING_ROUTES.privacy}>Privacy</Link>
            <Link href={MARKETING_ROUTES.terms}>Terms</Link>
            <Link href={MARKETING_ROUTES.bookDemo}>Book a demo</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function DefaultFooter() {
  return (
    <footer className="border-marketing-line bg-marketing-ink text-marketing-surface/90 border-t">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_1.85fr] lg:px-8">
        <div>
          <Link
            href={MARKETING_ROUTES.home}
            className="font-marketing-display text-xl tracking-tight"
          >
            {BRAND.name}
          </Link>
          <p className="mt-3 max-w-sm text-sm text-white/65">{BRAND.tagline}</p>
          <div className="mt-8 max-w-sm">
            <NewsletterForm />
          </div>
          <ul className="mt-8 flex flex-wrap gap-4" aria-label="Social links">
            {SOCIAL_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/65 transition hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-xs text-white/45">
            © {new Date().getFullYear()} Busal OS. All rights reserved.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FOOTER_COLUMNS.map(([title, links]) => (
            <div key={title}>
              <p className="text-xs font-semibold tracking-[0.16em] text-white/50 uppercase">
                {title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/75 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="text-marketing-muted mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-white/40 sm:px-6 lg:px-8">
          <p>getbusal.com · London, United Kingdom</p>
          <div className="flex flex-wrap gap-4">
            <Link href={MARKETING_ROUTES.privacy} className="hover:text-white">
              Privacy
            </Link>
            <Link href={MARKETING_ROUTES.terms} className="hover:text-white">
              Terms
            </Link>
            <Link href={MARKETING_ROUTES.bookDemo} className="hover:text-white">
              Book a demo
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function MarketingFooter() {
  const isHome = usePathname() === "/";

  if (isHome) {
    return <HomeFooter />;
  }

  return <DefaultFooter />;
}
