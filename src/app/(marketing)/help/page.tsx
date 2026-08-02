import { HelpPage } from "@/modules/marketing/components/help/help-page";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Help Center",
  description:
    "Busal OS help center: guides for getting started, orders, customers, inventory, AI, and billing.",
  path: MARKETING_ROUTES.help,
});

export default function HelpRoutePage() {
  return <HelpPage />;
}
