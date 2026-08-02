import { MarketingCtaBand } from "@/modules/marketing/components/marketing-cta";
import { PageHero, FeatureGrid } from "@/modules/marketing/components/page-primitives";
import {
  MarketingHeading,
  MarketingLead,
  MarketingSection,
} from "@/modules/marketing/components/marketing-typography";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { MODULES } from "@/modules/marketing/content/site-copy";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Features",
  description:
    "Explore Busal OS modules: CRM, POS, inventory, reservations, QR ordering, kitchen display, finance, HR, marketing, analytics, AI, customer portal, and admin.",
  path: MARKETING_ROUTES.features,
});

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title="Every module your operators touch—designed as one system."
        description="From front-of-house to finance, Busal OS modules share customers, inventory, permissions, and audit trails. Less switching. Fewer mistakes. Faster decisions."
        primaryHref={MARKETING_ROUTES.bookDemo}
        secondaryHref={MARKETING_ROUTES.pricing}
        secondaryLabel="See pricing"
        breadcrumbs={[{ name: "Features", path: MARKETING_ROUTES.features }]}
      />
      <MarketingSection className="pt-0">
        <MarketingHeading>Core operations</MarketingHeading>
        <MarketingLead>
          The daily stack: selling, serving, stocking, and supporting customers without losing
          context between tools.
        </MarketingLead>
        <FeatureGrid items={[...MODULES]} />
      </MarketingSection>
      <MarketingSection className="pb-24">
        <MarketingCtaBand
          title="Match features to your service model."
          description="We’ll prioritize the modules that remove the most friction in your first 90 days."
        />
      </MarketingSection>
    </>
  );
}
