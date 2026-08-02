import { MarketingCtaBand } from "@/modules/marketing/components/marketing-cta";
import { PageHero } from "@/modules/marketing/components/page-primitives";
import { MarketingSection } from "@/modules/marketing/components/marketing-typography";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { FAQ_ITEMS } from "@/modules/marketing/content/site-copy";
import { faqJsonLd, marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "FAQ",
  description:
    "Frequently asked questions about Busal OS: implementation, pricing, AI, multi-location support, and replacing fragmented tools.",
  path: MARKETING_ROUTES.faq,
});

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd([...FAQ_ITEMS])) }}
      />
      <PageHero
        eyebrow="FAQ"
        title="Common questions, straight answers."
        description="Everything you need to know about Busal OS—implementation, plans, AI, and how the platform replaces disconnected tools."
        primaryHref={MARKETING_ROUTES.bookDemo}
        secondaryHref={MARKETING_ROUTES.contact}
        secondaryLabel="Contact sales"
        breadcrumbs={[{ name: "FAQ", path: MARKETING_ROUTES.faq }]}
      />

      <MarketingSection className="pt-0 pb-24">
        <dl className="space-y-0">
          {FAQ_ITEMS.map((item) => (
            <div key={item.q} className="border-marketing-line border-t py-8">
              <dt className="text-marketing-ink text-lg font-semibold">{item.q}</dt>
              <dd className="text-marketing-muted mt-3 text-sm leading-relaxed sm:text-base">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-16">
          <MarketingCtaBand
            title="Still deciding?"
            description="Book a demo for answers tailored to your branches, workflows, and growth plans."
          />
        </div>
      </MarketingSection>
    </>
  );
}
