import { FeaturesPage } from "@/modules/marketing/components/features/features-page";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Features",
  description:
    "Explore Busal OS modules: CRM, POS, inventory, reservations, QR ordering, kitchen display, finance, HR, marketing, analytics, AI, customer portal, and admin.",
  path: MARKETING_ROUTES.features,
});

export default function FeaturesRoutePage() {
  return <FeaturesPage />;
}
