import type { IntegrationCategory } from "@prisma/client";

export const PLACEHOLDER_INTEGRATION_PROVIDERS: Array<{
  slug: string;
  name: string;
  category: IntegrationCategory;
  description: string;
}> = [
  {
    slug: "stripe",
    name: "Stripe",
    category: "PAYMENT",
    description: "Payment processing and subscriptions",
  },
  {
    slug: "paypal",
    name: "PayPal",
    category: "PAYMENT",
    description: "Online payments and checkout",
  },
  {
    slug: "square",
    name: "Square",
    category: "PAYMENT",
    description: "In-person and online payments",
  },
  { slug: "twilio", name: "Twilio", category: "MESSAGING", description: "SMS and voice messaging" },
  {
    slug: "whatsapp",
    name: "WhatsApp",
    category: "MESSAGING",
    description: "WhatsApp Business messaging",
  },
  {
    slug: "meta",
    name: "Meta",
    category: "MARKETING",
    description: "Facebook and Instagram integrations",
  },
  {
    slug: "google",
    name: "Google",
    category: "PRODUCTIVITY",
    description: "Google Workspace and APIs",
  },
  {
    slug: "microsoft",
    name: "Microsoft",
    category: "PRODUCTIVITY",
    description: "Microsoft 365 and Azure",
  },
  {
    slug: "slack",
    name: "Slack",
    category: "COMMUNICATION",
    description: "Team messaging and notifications",
  },
  {
    slug: "discord",
    name: "Discord",
    category: "COMMUNICATION",
    description: "Community and team chat",
  },
  {
    slug: "hubspot",
    name: "HubSpot",
    category: "CRM",
    description: "CRM and marketing automation",
  },
  {
    slug: "mailchimp",
    name: "Mailchimp",
    category: "EMAIL",
    description: "Email marketing campaigns",
  },
  { slug: "shopify", name: "Shopify", category: "ECOMMERCE", description: "E-commerce store sync" },
  {
    slug: "woocommerce",
    name: "WooCommerce",
    category: "ECOMMERCE",
    description: "WordPress e-commerce sync",
  },
  {
    slug: "zapier",
    name: "Zapier",
    category: "AUTOMATION",
    description: "Workflow automation platform",
  },
  { slug: "make", name: "Make", category: "AUTOMATION", description: "Visual automation builder" },
];
