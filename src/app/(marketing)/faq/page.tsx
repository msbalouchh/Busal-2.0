import { FaqPage } from "@/modules/marketing/components/faq/faq-page";
import { getAllFaqItemsForSeo } from "@/modules/marketing/components/faq/faq-data";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { faqJsonLd, marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "FAQ",
  description:
    "Frequently asked questions about Busal OS: implementation, pricing, AI, multi-location support, and replacing fragmented tools.",
  path: MARKETING_ROUTES.faq,
});

export default function FaqRoutePage() {
  const faqItems = getAllFaqItemsForSeo();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqItems)) }}
      />
      <FaqPage />
    </>
  );
}
