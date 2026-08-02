import { ContactPage } from "@/modules/marketing/components/contact/contact-page";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Contact",
  description:
    "Contact Busal OS: sales, support, partnerships, and general enquiries. We're here to help growing businesses run on one platform.",
  path: MARKETING_ROUTES.contact,
});

export default function ContactRoutePage() {
  return <ContactPage />;
}
