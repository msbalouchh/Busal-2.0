import { PricingPage } from "@/modules/marketing/components/pricing/pricing-page";
import { PRICING_FAQ } from "@/modules/marketing/components/pricing/pricing-data";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { faqJsonLd, marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Pricing",
  description:
    "Busal OS pricing: one-time implementation £3,000–£4,000 and monthly plans from £299. Busal Core, Growth, Pro, and Enterprise.",
  path: MARKETING_ROUTES.pricing,
});

export default function PricingRoutePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd([...PRICING_FAQ])),
        }}
      />
      <PricingPage />
    </>
  );
}
