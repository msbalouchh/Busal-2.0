import type { Metadata } from "next";

import { BUSAL_LOGO_ICON } from "@/constants/brand";
import { resolvePublicAppUrl } from "@/config/app-url";

export const siteConfig = {
  name: "Busal OS",
  description:
    "The AI Operating System for Modern Businesses. Unify operations, customers, finance, and intelligence in one platform.",
  url: resolvePublicAppUrl(),
  ogImage: "/opengraph-image",
  links: {
    github: "https://github.com/busal-os",
  },
} as const;

/** Canonical Busal favicon assets — all derived from public/branding/favicon.png */
export const BUSAL_FAVICON = {
  ico: "/favicon.ico",
  png48: "/branding/favicon-48.png",
  png192: "/branding/favicon-192.png",
  png512: "/branding/favicon-512.png",
  apple: "/apple-touch-icon.png",
  brandMark: BUSAL_LOGO_ICON.src,
} as const;

export const defaultMetadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  icons: {
    icon: [
      { url: BUSAL_FAVICON.ico, sizes: "48x48", type: "image/x-icon" },
      { url: BUSAL_FAVICON.png48, sizes: "48x48", type: "image/png" },
      { url: BUSAL_FAVICON.png192, sizes: "192x192", type: "image/png" },
      { url: BUSAL_FAVICON.png512, sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: BUSAL_FAVICON.apple, sizes: "180x180", type: "image/png" }],
    shortcut: [{ url: BUSAL_FAVICON.ico, type: "image/x-icon" }],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};
