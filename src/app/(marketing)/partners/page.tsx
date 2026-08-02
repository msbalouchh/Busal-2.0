import { MarketingCtaBand } from "@/modules/marketing/components/marketing-cta";
import { FeatureGrid, PageHero } from "@/modules/marketing/components/page-primitives";
import {
  MarketingEyebrow,
  MarketingHeading,
  MarketingLead,
  MarketingSection,
} from "@/modules/marketing/components/marketing-typography";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { INTEGRATIONS } from "@/modules/marketing/content/site-copy";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Partners",
  description:
    "Partner with Busal OS: implementation partners, technology integrations, and referral programmes for agencies serving service businesses.",
  path: MARKETING_ROUTES.partners,
});

const PARTNER_TYPES = [
  {
    name: "Implementation partners",
    summary:
      "Consultancies and agencies that configure Busal OS for restaurants, retail, and hospitality clients— with co-selling and delivery support.",
  },
  {
    name: "Technology partners",
    summary:
      "Payments, accounting, identity, and communications providers that integrate through our API gateway and webhooks.",
  },
  {
    name: "Referral partners",
    summary:
      "Advisors and industry networks that introduce growing businesses to Busal— with transparent commercial terms.",
  },
  {
    name: "Industry specialists",
    summary:
      "Vertical experts who bring domain knowledge—we bring the platform. Together we deliver outcomes, not shelfware.",
  },
] as const;

const PARTNER_BENEFITS = [
  {
    name: "Dedicated partner contact",
    summary:
      "A single point of contact for onboarding, deal registration, and technical questions.",
  },
  {
    name: "Co-marketing opportunities",
    summary: "Joint case studies, events, and content for aligned audiences.",
  },
  {
    name: "Implementation playbooks",
    summary:
      "Structured discovery, configuration, and training materials you can deliver with confidence.",
  },
  {
    name: "Sandbox access",
    summary: "Demo environments to showcase Busal OS in sales and delivery conversations.",
  },
] as const;

export default function PartnersPage() {
  return (
    <>
      <PageHero
        eyebrow="Partners"
        title="Grow with us. Deliver outcomes together."
        description="Whether you implement, integrate, or advise service businesses—we partner with teams who share our belief that operators deserve one platform, not a fragmented stack."
        primaryHref={MARKETING_ROUTES.contact}
        primaryLabel="Become a partner"
        secondaryHref={MARKETING_ROUTES.bookDemo}
        secondaryLabel="See the platform"
        breadcrumbs={[{ name: "Partners", path: MARKETING_ROUTES.partners }]}
      />

      <MarketingSection className="pt-0">
        <FeatureGrid items={[...PARTNER_TYPES]} columns="two" />
      </MarketingSection>

      <MarketingSection>
        <MarketingEyebrow>Partner programme</MarketingEyebrow>
        <MarketingHeading>What partners receive.</MarketingHeading>
        <FeatureGrid items={[...PARTNER_BENEFITS]} columns="two" />
      </MarketingSection>

      <MarketingSection>
        <MarketingEyebrow>Integrations</MarketingEyebrow>
        <MarketingHeading>Built to connect.</MarketingHeading>
        <MarketingLead>
          Technology partners integrate through payments, webhooks, API gateway, and document
          storage pathways.
        </MarketingLead>
        <ul className="mt-10 flex flex-wrap gap-3">
          {INTEGRATIONS.map((item) => (
            <li
              key={item}
              className="border-marketing-line text-marketing-ink rounded-full border px-4 py-2 text-sm font-medium"
            >
              {item}
            </li>
          ))}
        </ul>
      </MarketingSection>

      <MarketingSection className="pb-24">
        <MarketingCtaBand
          title="Interested in partnering?"
          description="Contact us at sales@getbusal.com with your partnership type and we'll respond within two business days."
        />
      </MarketingSection>
    </>
  );
}
