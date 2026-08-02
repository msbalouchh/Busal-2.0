import { PlatformPage } from "@/modules/marketing/components/platform/platform-page";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Platform",
  description:
    "Busal OS is the AI operating system that connects POS, CRM, inventory, kitchen, finance, and admin in one multi-tenant platform.",
  path: MARKETING_ROUTES.platform,
});

export default function PlatformRoutePage() {
  return <PlatformPage />;
}
