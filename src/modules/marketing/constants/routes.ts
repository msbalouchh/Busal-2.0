export const MARKETING_ROUTES = {
  home: "/",
  platform: "/platform",
  ai: "/ai",
  industries: "/industries",
  features: "/features",
  pricing: "/pricing",
  customerSuccess: "/customer-success",
  whyBusal: "/why-busal",
  about: "/about",
  resources: "/resources",
  blog: "/blog",
  help: "/help",
  faq: "/faq",
  contact: "/contact",
  bookDemo: "/book-demo",
  partners: "/partners",
  careers: "/careers",
  privacy: "/privacy",
  terms: "/terms",
} as const;

export type MarketingRoute = (typeof MARKETING_ROUTES)[keyof typeof MARKETING_ROUTES];

export const MARKETING_NAV = [
  { label: "Platform", href: MARKETING_ROUTES.platform },
  { label: "AI", href: MARKETING_ROUTES.ai },
  { label: "Industries", href: MARKETING_ROUTES.industries },
  { label: "Features", href: MARKETING_ROUTES.features },
  { label: "Pricing", href: MARKETING_ROUTES.pricing },
  { label: "Resources", href: MARKETING_ROUTES.resources },
] as const;

export const MARKETING_FOOTER = {
  platform: [
    { label: "Platform", href: MARKETING_ROUTES.platform },
    { label: "AI Platform", href: MARKETING_ROUTES.ai },
    { label: "Features", href: MARKETING_ROUTES.features },
    { label: "Pricing", href: MARKETING_ROUTES.pricing },
  ],
  industries: [
    { label: "Restaurants", href: MARKETING_ROUTES.industries },
    { label: "Retail", href: MARKETING_ROUTES.industries },
    { label: "Hotels", href: MARKETING_ROUTES.industries },
    { label: "Clinics", href: MARKETING_ROUTES.industries },
    { label: "Salons", href: MARKETING_ROUTES.industries },
  ],
  resources: [
    { label: "Blog", href: MARKETING_ROUTES.blog },
    { label: "Help Center", href: MARKETING_ROUTES.help },
    { label: "Documentation", href: MARKETING_ROUTES.help },
    { label: "API", href: MARKETING_ROUTES.resources },
    { label: "FAQ", href: MARKETING_ROUTES.faq },
  ],
  company: [
    { label: "About", href: MARKETING_ROUTES.about },
    { label: "Careers", href: MARKETING_ROUTES.careers },
    { label: "Partners", href: MARKETING_ROUTES.partners },
    { label: "Contact", href: MARKETING_ROUTES.contact },
  ],
  legal: [
    { label: "Privacy", href: MARKETING_ROUTES.privacy },
    { label: "Terms", href: MARKETING_ROUTES.terms },
    { label: "Cookies", href: MARKETING_ROUTES.privacy },
    { label: "Security", href: MARKETING_ROUTES.platform },
  ],
  connect: [
    { label: "LinkedIn", href: "https://www.linkedin.com/company/busal-os" },
    { label: "Facebook", href: "https://www.facebook.com/getbusal" },
    { label: "X", href: "https://x.com/getbusal" },
    { label: "YouTube", href: "https://www.youtube.com/@getbusal" },
  ],
} as const;
