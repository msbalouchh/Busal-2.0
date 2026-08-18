import type { Metadata } from "next";

import { BRAND } from "@/modules/marketing/content/site-copy";
import { resolvePublicAppUrl } from "@/config/app-url";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";

export function marketingMetadata(input: {
  title: string;
  description: string;
  path?: string;
  image?: string;
}): Metadata {
  const baseUrl = resolvePublicAppUrl();
  const path = input.path ?? "";
  const url = `${baseUrl}${path}`;
  const title = input.title.includes(BRAND.name) ? input.title : `${input.title} | ${BRAND.name}`;
  const image = input.image ?? `${baseUrl}/opengraph-image`;

  return {
    title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_GB",
      url,
      title,
      description: input.description,
      siteName: BRAND.name,
      images: [{ url: image, width: 1200, height: 630, alt: BRAND.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: input.description,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

export function organizationJsonLd() {
  const baseUrl = resolvePublicAppUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    url: baseUrl,
    logo: `${baseUrl}/branding/logo.png`,
    description: BRAND.description,
    email: "sales@getbusal.com",
    sameAs: [
      "https://www.linkedin.com/company/busal-os",
      "https://x.com/getbusal",
      "https://www.youtube.com/@getbusal",
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "71-75 Shelton Street",
      addressLocality: "London",
      postalCode: "WC2H 9JQ",
      addressCountry: "GB",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: "sales@getbusal.com",
        telephone: "+44-20-7946-0958",
        areaServed: "GB",
        availableLanguage: ["English"],
      },
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@getbusal.com",
        telephone: "+44-20-7946-0958",
        areaServed: "GB",
        availableLanguage: ["English"],
      },
    ],
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BRAND.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: resolvePublicAppUrl(),
    description: BRAND.description,
    offers: {
      "@type": "Offer",
      priceCurrency: "GBP",
      price: "299.00",
      description: "Busal Core from £299/month after implementation",
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  const baseUrl = resolvePublicAppUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path === "/" ? baseUrl : `${baseUrl}${item.path}`,
    })),
  };
}

export function faqJsonLd(items: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function homeBreadcrumbs() {
  return [{ name: "Home", path: MARKETING_ROUTES.home }];
}
