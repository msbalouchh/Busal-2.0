"use client";

import { Facebook, Linkedin, Twitter, Youtube } from "lucide-react";
import Link from "next/link";

import { BusalLogo } from "@/components/brand/busal-logo";
import { NewsletterForm } from "@/modules/marketing/components/newsletter-form";
import { MARKETING_FOOTER, MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { BRAND, SOCIAL_LINKS } from "@/modules/marketing/content/site-copy";

import "./marketing-footer.css";

const FOOTER_COLUMNS = [
  ["Platform", MARKETING_FOOTER.platform],
  ["Industries", MARKETING_FOOTER.industries],
  ["Resources", MARKETING_FOOTER.resources],
  ["Company", MARKETING_FOOTER.company],
  ["Legal", MARKETING_FOOTER.legal],
  ["Connect", MARKETING_FOOTER.connect],
] as const;

const SOCIAL_ICONS = {
  LinkedIn: Linkedin,
  Facebook,
  X: Twitter,
  YouTube: Youtube,
} as const;

function FooterLink({
  href,
  label,
  external,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  if (external || href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    );
  }

  return <Link href={href}>{label}</Link>;
}

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mkt-footer">
      <div className="mkt-footer__glow" aria-hidden="true" />

      <div className="mkt-footer__container mkt-footer__main">
        <div className="mkt-footer__top">
          <div className="mkt-footer__brand">
            <Link href={MARKETING_ROUTES.home} className="mkt-footer__logo">
              <BusalLogo className="mkt-footer__logo-img" variant="horizontal" />
            </Link>
            <p className="mkt-footer__description">{BRAND.description}</p>
            <div className="mkt-footer__newsletter">
              <NewsletterForm />
            </div>
            <ul className="mkt-footer__social" aria-label="Social media">
              {SOCIAL_LINKS.map((link) => {
                const Icon = SOCIAL_ICONS[link.label as keyof typeof SOCIAL_ICONS];
                return (
                  <li key={link.href}>
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                      {Icon ? <Icon size={18} strokeWidth={1.75} aria-hidden="true" /> : null}
                      <span className="sr-only">{link.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <nav className="mkt-footer__nav" aria-label="Footer">
            {FOOTER_COLUMNS.map(([title, links]) => (
              <div key={title}>
                <p className="mkt-footer__column-title">{title}</p>
                <ul className="mkt-footer__links">
                  {links.map((link) => (
                    <li key={`${title}-${link.label}`}>
                      <FooterLink
                        href={link.href}
                        label={link.label}
                        external={title === "Connect"}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>

      <div className="mkt-footer__bar">
        <div className="mkt-footer__container mkt-footer__bar-inner">
          <div className="mkt-footer__bar-meta">
            <p>© {year} Busal OS. All rights reserved.</p>
            <span aria-hidden="true">·</span>
            <p>
              Made with <span className="mkt-footer__heart">❤️</span> for modern businesses.
            </p>
          </div>
          <p>getbusal.com · London, United Kingdom</p>
        </div>
      </div>
    </footer>
  );
}
