import type { MetadataRoute } from "next";

import { resolvePublicAppUrl } from "@/config/app-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = resolvePublicAppUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/app/",
          "/dashboard/",
          "/control-center/",
          "/portal/",
          "/api/",
          "/business-onboarding/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
