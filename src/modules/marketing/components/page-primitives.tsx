import {
  MarketingBreadcrumbs,
  type Crumb,
} from "@/modules/marketing/components/marketing-breadcrumbs";
import {
  MarketingEyebrow,
  MarketingHeading,
  MarketingLead,
  MarketingSection,
} from "@/modules/marketing/components/marketing-typography";
import {
  MarketingPrimaryCta,
  MarketingSecondaryCta,
} from "@/modules/marketing/components/marketing-cta";
import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  breadcrumbs,
}: {
  eyebrow: string;
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  breadcrumbs?: Crumb[];
}) {
  return (
    <>
      {breadcrumbs?.length ? <MarketingBreadcrumbs items={breadcrumbs} /> : null}
      <MarketingSection
        className={breadcrumbs?.length ? "pt-8 pb-10 sm:pt-12" : "pt-14 pb-10 sm:pt-20"}
      >
        <MarketingEyebrow>{eyebrow}</MarketingEyebrow>
        <MarketingHeading as="h1">{title}</MarketingHeading>
        <MarketingLead>{description}</MarketingLead>
        {(primaryHref || secondaryHref) && (
          <div className="mt-8 flex flex-wrap gap-3">
            {primaryHref ? (
              <MarketingPrimaryCta href={primaryHref}>
                {primaryLabel ?? "Book a demo"}
              </MarketingPrimaryCta>
            ) : null}
            {secondaryHref ? (
              <MarketingSecondaryCta href={secondaryHref}>
                {secondaryLabel ?? "Contact sales"}
              </MarketingSecondaryCta>
            ) : null}
          </div>
        )}
      </MarketingSection>
    </>
  );
}

export function FeatureGrid({
  items,
  columns = "three",
}: {
  items: Array<{ name: string; summary: string }>;
  columns?: "two" | "three";
}) {
  return (
    <div
      className={cn(
        "mt-10 grid min-w-0 gap-x-8 gap-y-10",
        columns === "two" ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {items.map((item) => (
        <article key={item.name} className="border-marketing-line min-w-0 border-t pt-5">
          <h3 className="text-marketing-ink text-base font-semibold tracking-tight text-pretty">
            {item.name}
          </h3>
          <p className="text-marketing-muted mt-2 text-sm leading-relaxed text-pretty">
            {item.summary}
          </p>
        </article>
      ))}
    </div>
  );
}

export function ContentBlock({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="marketing-content prose-marketing max-w-3xl min-w-0 space-y-5 text-sm leading-relaxed sm:text-base">
      {title ? (
        <h2 className="font-marketing-display text-2xl tracking-tight text-pretty sm:text-3xl">
          {title}
        </h2>
      ) : null}
      {children}
    </div>
  );
}
