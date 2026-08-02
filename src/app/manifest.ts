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
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    categories: ["business", "productivity"],
    lang: "en-GB",
    id: resolvePublicAppUrl(),
  };
}
