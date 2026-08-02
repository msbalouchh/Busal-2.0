import { BookDemoPage } from "@/modules/marketing/components/book-demo/book-demo-page";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Book a Demo",
  description:
    "Book a Busal OS demo: walk through POS, CRM, kitchen, AI, and multi-branch workflows with a platform specialist.",
  path: MARKETING_ROUTES.bookDemo,
});

export default function BookDemoRoutePage() {
  return <BookDemoPage />;
}
