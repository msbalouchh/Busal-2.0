import type { MetadataRoute } from "next";

import { resolvePublicAppUrl } from "@/config/app-url";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Busal OS",
    short_name: "Busal",
    description: "The AI Operating System for Modern Businesses",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5f1",
    theme_color: "#0c1222",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "64x64",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/branding/logo.png",
        sizes: "1536x1024",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["business", "productivity"],
    lang: "en-GB",
    id: resolvePublicAppUrl(),
  };
}
