import { MarketingCtaBand } from "@/modules/marketing/components/marketing-cta";
import { ContentBlock, PageHero } from "@/modules/marketing/components/page-primitives";
import {
  MarketingEyebrow,
  MarketingHeading,
  MarketingSection,
} from "@/modules/marketing/components/marketing-typography";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { BRAND, STATS } from "@/modules/marketing/content/site-copy";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "About",
  description:
    "Busal OS is the AI operating system for modern businesses—unifying operations, customers, finance, and intelligence for growing service teams.",
  path: MARKETING_ROUTES.about,
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="Building the operating system modern businesses deserve."
        description={BRAND.description}
        primaryHref={MARKETING_ROUTES.bookDemo}
        secondaryHref={MARKETING_ROUTES.careers}
        secondaryLabel="Join the team"
        breadcrumbs={[{ name: "About", path: MARKETING_ROUTES.about }]}
      />

      <MarketingSection className="pt-0">
        <ContentBlock title="Our mission">
          <p>
            Growing businesses shouldn&apos;t have to stitch together POS, CRM, inventory, and
            reporting from vendors that never talk to each other. {BRAND.name} exists to give
            operators one AI-first platform—so decisions happen with clarity, teams move with speed,
            and leaders stay in control.
          </p>
          <p>
            We started with restaurants because service pressure exposes every gap in a fragmented
            stack. That depth became the foundation for an industry-ready architecture—retail,
            hospitality, clinics, and professional services run on the same core.
          </p>
        </ContentBlock>
      </MarketingSection>

      <MarketingSection>
        <MarketingEyebrow>At a glance</MarketingEyebrow>
        <MarketingHeading>The platform in numbers.</MarketingHeading>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="border-marketing-line border-t pt-5">
              <p className="font-marketing-display text-marketing-ink text-4xl tracking-tight">
                {stat.value}
              </p>
              <p className="text-marketing-ink mt-2 text-sm font-semibold">{stat.label}</p>
              <p className="text-marketing-muted text-xs">{stat.hint}</p>
            </div>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection>
        <ContentBlock title="How we work">
          <p>
            We partner with customers through structured implementation—not software dumps.
            Discovery, configuration, training, and go-live support are how we measure success
            alongside product adoption and business outcomes.
          </p>
          <p>
            Our team is remote-first across the UK and beyond, building the platform we wish every
            multi-branch operator had from day one.
          </p>
        </ContentBlock>
      </MarketingSection>

      <MarketingSection className="pb-24">
        <MarketingCtaBand
          title="Want to learn more?"
          description="Book a demo to see how Busal OS fits your operation—or explore careers if you want to help build it."
        />
      </MarketingSection>
    </>
  );
}
