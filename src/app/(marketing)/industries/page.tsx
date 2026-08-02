import { IndustryMark } from "@/modules/marketing/components/industry-mark";
import { MarketingCtaBand } from "@/modules/marketing/components/marketing-cta";
import { PageHero } from "@/modules/marketing/components/page-primitives";
import {
  MarketingEyebrow,
  MarketingHeading,
  MarketingLead,
  MarketingSection,
} from "@/modules/marketing/components/marketing-typography";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { INDUSTRY_DETAILS } from "@/modules/marketing/content/site-copy";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Industries",
  description:
    "Busal OS serves restaurants today with depth—and extends to retail, hotels, clinics, salons, gyms, education, construction, manufacturing, real estate, and professional services.",
  path: MARKETING_ROUTES.industries,
});

export default function IndustriesPage() {
  return (
    <>
      <PageHero
        eyebrow="Industries"
        title="Industry depth without a rewrite for every vertical."
        description="Start with restaurant-grade operations. Expand into adjacent industries on the same multi-tenant foundation, permissions model, and AI platform."
        primaryHref={MARKETING_ROUTES.bookDemo}
        secondaryHref={MARKETING_ROUTES.contact}
        secondaryLabel="Talk to sales"
        breadcrumbs={[{ name: "Industries", path: MARKETING_ROUTES.industries }]}
      />

      <MarketingSection className="pt-0">
        <MarketingEyebrow>Verticals</MarketingEyebrow>
        <MarketingHeading>Eleven industries. One operating system.</MarketingHeading>
        <MarketingLead>
          Each vertical inherits Busal&apos;s shared core—then specialises in the rhythms that make
          the business feel native.
        </MarketingLead>
      </MarketingSection>

      {INDUSTRY_DETAILS.map((industry) => (
        <MarketingSection key={industry.name} className="border-marketing-line border-t">
          <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start lg:gap-12">
            <IndustryMark name={industry.name} className="h-16 w-16" />
            <div>
              <h2 className="font-marketing-display text-marketing-ink text-3xl tracking-tight sm:text-4xl">
                {industry.name}
              </h2>
              <p className="text-marketing-muted mt-3 max-w-2xl text-base leading-relaxed">
                {industry.summary}
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-3">
                {industry.benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="border-marketing-line bg-marketing-surface rounded-2xl border px-4 py-4 text-sm leading-relaxed"
                  >
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </MarketingSection>
      ))}

      <MarketingSection className="pb-24">
        <MarketingCtaBand
          title="Tell us your industry. We’ll map the operating system."
          description="Every implementation starts with how your teams actually work—not a generic template dump."
        />
      </MarketingSection>
    </>
  );
}
