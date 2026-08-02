import { AboutPage } from "@/modules/marketing/components/about/about-page";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "About",
  description:
    "Busal OS is the AI operating system for modern businesses—unifying operations, customers, finance, and intelligence for growing service teams.",
  path: MARKETING_ROUTES.about,
});

export default function AboutRoutePage() {
  return <AboutPage />;
}
