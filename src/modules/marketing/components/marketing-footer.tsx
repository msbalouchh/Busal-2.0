"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NewsletterForm } from "@/modules/marketing/components/newsletter-form";
import { MARKETING_FOOTER, MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { BRAND, SOCIAL_LINKS } from "@/modules/marketing/content/site-copy";
import { cn } from "@/lib/utils";

export function MarketingFooter() {
  const isHome = usePathname() === "/";

  return (
    <footer
      className={cn(
        "border-marketing-line text-marketing-surface/90 border-t",
        isHome ? "border-white/10 bg-[#070B16]" : "bg-marketing-ink",
      )}
    >
      <div
        className={cn(
          "mx-auto grid gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_1.85fr]",
          isHome ? "max-w-[1440px] lg:px-10" : "max-w-6xl lg:px-8",
        )}
      >
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
          {(
            [
              ["Product", MARKETING_FOOTER.product],
              ["Company", MARKETING_FOOTER.company],
              ["Resources", MARKETING_FOOTER.resources],
              ["Legal", MARKETING_FOOTER.legal],
            ] as const
          ).map(([title, links]) => (
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
        <div
          className={cn(
            "text-marketing-muted mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-white/40 sm:px-6",
            isHome ? "max-w-[1440px] lg:px-10" : "max-w-6xl lg:px-8",
          )}
        >
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
