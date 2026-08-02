import { ResourcesPage } from "@/modules/marketing/components/resources/resources-page";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Resources",
  description:
    "Busal OS resources: blog, help center, and FAQ—guides for operators exploring the AI operating system.",
  path: MARKETING_ROUTES.resources,
});

export default function ResourcesRoutePage() {
  return <ResourcesPage />;
}
