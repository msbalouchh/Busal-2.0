import { HomePage } from "@/modules/marketing/components/home/home-page";
import { BRAND } from "@/modules/marketing/content/site-copy";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

import "@/modules/marketing/components/home/home.css";

export const metadata = marketingMetadata({
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.description,
  path: "/",
});

export default function MarketingHomePage() {
  return <HomePage />;
}
