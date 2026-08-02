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
  product: [
    { label: "Platform", href: MARKETING_ROUTES.platform },
    { label: "AI Platform", href: MARKETING_ROUTES.ai },
    { label: "Features", href: MARKETING_ROUTES.features },
    { label: "Pricing", href: MARKETING_ROUTES.pricing },
    { label: "Industries", href: MARKETING_ROUTES.industries },
  ],
  company: [
    { label: "Why Busal", href: MARKETING_ROUTES.whyBusal },
    { label: "About", href: MARKETING_ROUTES.about },
    { label: "Customer Success", href: MARKETING_ROUTES.customerSuccess },
    { label: "Partners", href: MARKETING_ROUTES.partners },
    { label: "Careers", href: MARKETING_ROUTES.careers },
  ],
  resources: [
    { label: "Resources", href: MARKETING_ROUTES.resources },
    { label: "Blog", href: MARKETING_ROUTES.blog },
    { label: "Help Center", href: MARKETING_ROUTES.help },
    { label: "FAQ", href: MARKETING_ROUTES.faq },
    { label: "Contact", href: MARKETING_ROUTES.contact },
    { label: "Book a Demo", href: MARKETING_ROUTES.bookDemo },
  ],
  legal: [
    { label: "Privacy Policy", href: MARKETING_ROUTES.privacy },
    { label: "Terms & Conditions", href: MARKETING_ROUTES.terms },
  ],
} as const;
