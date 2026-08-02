import type { MetadataRoute } from "next";

import { resolvePublicAppUrl } from "@/config/app-url";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { BLOG_POSTS } from "@/modules/marketing/content/site-copy";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = resolvePublicAppUrl();
  const lastModified = new Date();

  const marketingPaths = Object.values(MARKETING_ROUTES);

  return [
    ...marketingPaths.map((path) => ({
      url: path === "/" ? baseUrl : `${baseUrl}${path}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.7,
    })),
    ...BLOG_POSTS.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    {
      url: `${baseUrl}/login`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/portal/login`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
  ];
}
