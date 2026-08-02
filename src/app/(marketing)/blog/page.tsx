import { BlogPage } from "@/modules/marketing/components/blog/blog-page";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Blog",
  description:
    "Busal OS blog: insights on operating systems, AI for service businesses, and implementation that delivers lasting results.",
  path: MARKETING_ROUTES.blog,
});

export default function BlogRoutePage() {
  return <BlogPage />;
}
