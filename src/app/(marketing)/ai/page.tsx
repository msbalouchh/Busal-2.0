import { AiPage } from "@/modules/marketing/components/ai/ai-page";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "AI Platform",
  description:
    "Busal AI agents for sales, marketing, finance, HR, support, operations, and executive briefings—grounded in your live business data.",
  path: MARKETING_ROUTES.ai,
});

export default function AiPlatformRoutePage() {
  return <AiPage />;
}
