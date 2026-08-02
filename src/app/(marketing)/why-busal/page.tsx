import { WhyBusalPage } from "@/modules/marketing/components/why-busal/why-busal-page";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Why Busal",
  description:
    "Why growing businesses choose Busal OS: one AI-first operating system instead of fragmented POS, CRM, and inventory tools.",
  path: MARKETING_ROUTES.whyBusal,
});

export default function WhyBusalRoutePage() {
  return <WhyBusalPage />;
}
