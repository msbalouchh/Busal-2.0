import { CustomerSuccessPage } from "@/modules/marketing/components/customer-success/customer-success-page";
import { SUCCESS_FAQ } from "@/modules/marketing/components/customer-success/customer-success-data";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { faqJsonLd, marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Customer Success",
  description:
    "From discovery to go-live and beyond—Busal OS customer success guides your team through implementation, training, and continuous growth.",
  path: MARKETING_ROUTES.customerSuccess,
});

export default function CustomerSuccessRoutePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd([...SUCCESS_FAQ])),
        }}
      />
      <CustomerSuccessPage />
    </>
  );
}
