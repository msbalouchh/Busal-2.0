import { MarketingCtaBand } from "@/modules/marketing/components/marketing-cta";
import { FeatureGrid, PageHero } from "@/modules/marketing/components/page-primitives";
import {
  MarketingEyebrow,
  MarketingHeading,
  MarketingLead,
  MarketingSection,
} from "@/modules/marketing/components/marketing-typography";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { INTEGRATIONS, SECURITY_POINTS } from "@/modules/marketing/content/site-copy";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Why Busal",
  description:
    "Why growing businesses choose Busal OS: one AI-first operating system instead of fragmented POS, CRM, and inventory tools.",
  path: MARKETING_ROUTES.whyBusal,
});

const DIFFERENTIATORS = [
  {
    name: "One operating system",
    summary:
      "POS, CRM, kitchen, inventory, finance, and AI share the same data model—no sync tax, no reconciliation drift.",
  },
  {
    name: "AI that sees your operation",
    summary:
      "Domain agents read live queues, loyalty, and revenue—not generic chat—so briefings are actionable before service starts.",
  },
  {
    name: "Built for service pressure",
    summary:
      "Restaurants are our deepest vertical, but the architecture scales to retail, hospitality, clinics, and professional services.",
  },
  {
    name: "Implementation that sticks",
    summary:
      "Discovery, configuration, training, and go-live support are structured engagements—not a login email and a PDF.",
  },
  {
    name: "Multi-branch by design",
    summary:
      "Roles, permissions, and reporting are scoped by business and branch from the start, not bolted on later.",
  },
  {
    name: "Transparent commercial model",
    summary:
      "One-time implementation, clear monthly plans, and enterprise terms when groups need governance and SLAs.",
  },
] as const;

export default function WhyBusalPage() {
  return (
    <>
      <PageHero
        eyebrow="Why Busal"
        title="Stop paying the tax of disconnected tools."
        description="When POS, CRM, and inventory disagree, operations lose time, margin, and guest trust. Busal OS replaces the stack with one platform built for how service businesses actually run."
        primaryHref={MARKETING_ROUTES.bookDemo}
        secondaryHref={MARKETING_ROUTES.platform}
        secondaryLabel="Explore platform"
        breadcrumbs={[{ name: "Why Busal", path: MARKETING_ROUTES.whyBusal }]}
      />

      <MarketingSection className="pt-0">
        <FeatureGrid items={[...DIFFERENTIATORS]} />
      </MarketingSection>

      <MarketingSection>
        <MarketingEyebrow>Security & trust</MarketingEyebrow>
        <MarketingHeading>Enterprise-ready foundations.</MarketingHeading>
        <MarketingLead>
          Tenant isolation, secure authentication, and audit trails are part of the platform—not
          add-ons.
        </MarketingLead>
        <FeatureGrid
          items={SECURITY_POINTS.map((point) => ({ name: point.title, summary: point.summary }))}
          columns="two"
        />
      </MarketingSection>

      <MarketingSection>
        <MarketingEyebrow>Integrations</MarketingEyebrow>
        <MarketingHeading>Connect what you already use.</MarketingHeading>
        <MarketingLead>
          Payments, accounting exports, webhooks, and identity providers integrate through a
          consistent gateway.
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
          title="See the difference in your workflows."
          description="Walk through orders, kitchen, CRM, and AI briefings in a demo tailored to your operation."
        />
      </MarketingSection>
    </>
  );
}
