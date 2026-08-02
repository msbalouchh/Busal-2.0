import { IndustriesPage } from "@/modules/marketing/components/industries/industries-page";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Industries",
  description:
    "Busal OS serves restaurants today with depth—and extends to retail, hotels, clinics, salons, gyms, education, construction, manufacturing, real estate, and professional services.",
  path: MARKETING_ROUTES.industries,
});

export default function IndustriesRoutePage() {
  return <IndustriesPage />;
}
