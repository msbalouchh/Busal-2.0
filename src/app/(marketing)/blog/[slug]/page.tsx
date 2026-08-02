import { notFound } from "next/navigation";

import "@/modules/marketing/components/blog/blog-article.css";
import "@/modules/marketing/components/home/home.css";
import { BLOG_ARTICLE_BODIES } from "@/modules/marketing/components/blog/blog-article-bodies";
import { BlogArticlePage } from "@/modules/marketing/components/blog/blog-article-page";
import { getBlogArticleBySlug } from "@/modules/marketing/components/blog/blog-data";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { BLOG_POSTS } from "@/modules/marketing/content/site-copy";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((item) => item.slug === slug);
  if (!post) return {};

  return marketingMetadata({
    title: post.title,
    description: post.excerpt,
    path: `${MARKETING_ROUTES.blog}/${post.slug}`,
  });
}

export default async function BlogArticleRoutePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getBlogArticleBySlug(slug);
  if (!article) notFound();

  const sections = BLOG_ARTICLE_BODIES[slug as keyof typeof BLOG_ARTICLE_BODIES];
  if (!sections) notFound();

  return <BlogArticlePage article={article} sections={sections} />;
}
