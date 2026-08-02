import Link from "next/link";

import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";

const base =
  "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-safe:active:scale-[0.98]";

export function MarketingPrimaryCta({
  href = MARKETING_ROUTES.bookDemo,
  children = "Book a demo",
  className,
}: {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        base,
        "bg-marketing-ink text-marketing-surface hover:bg-marketing-ink/90 focus-visible:ring-marketing-ink",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function MarketingSecondaryCta({
  href = ROUTES.signup,
  children = "Get started",
  className,
}: {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        base,
        "border-marketing-line text-marketing-ink hover:bg-marketing-panel focus-visible:ring-marketing-accent border bg-transparent",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function MarketingCtaBand({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-marketing-line from-marketing-panel to-marketing-surface relative overflow-hidden rounded-3xl border bg-gradient-to-br px-6 py-10 sm:px-10 sm:py-12">
      <div className="bg-marketing-accent/10 pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full blur-3xl" />
      <div className="relative max-w-2xl">
        <h2 className="font-marketing-display text-marketing-ink text-3xl tracking-tight sm:text-4xl">
          {title}
        </h2>
        <p className="text-marketing-muted mt-3 text-base sm:text-lg">{description}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <MarketingPrimaryCta />
          <MarketingSecondaryCta href={ROUTES.signup}>Start with Busal</MarketingSecondaryCta>
          <MarketingSecondaryCta href={MARKETING_ROUTES.contact}>
            Contact sales
          </MarketingSecondaryCta>
        </div>
      </div>
    </div>
  );
}
