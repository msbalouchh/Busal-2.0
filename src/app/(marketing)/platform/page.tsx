import { MarketingCtaBand } from "@/modules/marketing/components/marketing-cta";
import { PageHero, FeatureGrid } from "@/modules/marketing/components/page-primitives";
import { MarketingSection } from "@/modules/marketing/components/marketing-typography";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { MODULES } from "@/modules/marketing/content/site-copy";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Platform",
  description:
    "Busal OS is the AI operating system that connects POS, CRM, inventory, kitchen, finance, and admin in one multi-tenant platform.",
  path: MARKETING_ROUTES.platform,
});

export default function PlatformPage() {
  return (
    <>
      <PageHero
        eyebrow="Platform"
        title="One operating system. Every critical workflow."
        description="Busal OS replaces fragmented tools with a unified platform: operations, customers, money, people, and intelligence—scoped securely by business and branch."
        primaryHref={MARKETING_ROUTES.bookDemo}
        secondaryHref={MARKETING_ROUTES.features}
        secondaryLabel="Browse features"
        breadcrumbs={[{ name: "Platform", path: MARKETING_ROUTES.platform }]}
      />
      <MarketingSection className="pt-0">
        <FeatureGrid items={[...MODULES]} />
      </MarketingSection>
      <MarketingSection className="pb-24">
        <MarketingCtaBand
          title="See the platform in your context."
          description="We’ll walk through your service flow—from order capture to kitchen, CRM, and reporting."
        />
      </MarketingSection>
    </>
  );
}
