export type FaqItem = { q: string; a: string };

export type FaqCategory = {
  id: string;
  title: string;
  items: readonly FaqItem[];
};

export const FAQ_POPULAR_TOPICS = [
  {
    title: "Getting Started",
    summary: "Onboarding, first-week setup, and what to expect in your first 30 days.",
    icon: "rocket" as const,
    categoryId: "general",
  },
  {
    title: "Pricing",
    summary: "Plans, implementation fees, enterprise terms, and what's included.",
    icon: "pricing" as const,
    categoryId: "pricing",
  },
  {
    title: "Security",
    summary: "Encryption, access controls, audit logs, and compliance posture.",
    icon: "security" as const,
    categoryId: "security",
  },
  {
    title: "AI",
    summary: "How domain agents work, data boundaries, and operational intelligence.",
    icon: "ai" as const,
    categoryId: "ai-features",
  },
  {
    title: "Support",
    summary: "Help center, live chat, email support, and implementation assistance.",
    icon: "support" as const,
    categoryId: "support",
  },
  {
    title: "Integrations",
    summary: "POS, payments, accounting, and third-party tools connected to Busal.",
    icon: "integrations" as const,
    categoryId: "integrations",
  },
] as const;

export const FAQ_CATEGORIES: readonly FaqCategory[] = [
  {
    id: "general",
    title: "General",
    items: [
      {
        q: "What is Busal OS?",
        a: "Busal OS is an AI-powered operating system for service businesses. It unifies POS, CRM, inventory, kitchen operations, customer portal, and domain-specific AI agents in one platform—so your team runs from a single source of truth instead of a disconnected tool stack.",
      },
      {
        q: "Who is Busal OS built for?",
        a: "Busal is built for operators who run live service—restaurants, retail, hospitality, clinics, and multi-location groups that need real-time coordination across front-of-house, back-of-house, and customer experience.",
      },
      {
        q: "Is Busal OS only for restaurants?",
        a: "Restaurants are our deepest vertical today, but the architecture is industry-ready. Retail, hospitality, clinics, and professional services run on the same foundation with module configurations tailored to each sector.",
      },
    ],
  },
  {
    id: "platform",
    title: "Platform",
    items: [
      {
        q: "What modules are included?",
        a: "Core modules include POS, CRM, inventory, kitchen display, customer portal, analytics, and AI agents. You activate modules based on your plan and operational needs—no separate products to stitch together.",
      },
      {
        q: "Does Busal support multiple locations?",
        a: "Yes. Busal supports multi-location hierarchies with branch-level permissions, consolidated reporting, and shared or location-specific configurations. Enterprise plans include advanced org structures for franchise and group operators.",
      },
      {
        q: "Can I migrate from another system?",
        a: "Yes. Implementation includes data migration planning for customers, menus, inventory, and historical records where applicable. Scope is confirmed during discovery based on your current stack and data quality.",
      },
    ],
  },
  {
    id: "ai-features",
    title: "AI Features",
    items: [
      {
        q: "How does AI work inside Busal?",
        a: "Busal deploys domain-specific AI agents—Manager, Reception, Marketing, and Operations—that operate within your business context. They surface briefings, answer operational questions, and assist workflows using data you already run on the platform, governed by your permission model.",
      },
      {
        q: "How does AI use our data?",
        a: "AI agents operate within your tenant boundary and respect role-based access. They do not train on your proprietary data for other customers. Recommendations and briefings are generated from your live operational context.",
      },
      {
        q: "Can I control what AI agents access?",
        a: "Yes. Agent capabilities follow your existing permission and module configuration. Administrators define which roles and locations can invoke AI features, and audit logs track agent interactions.",
      },
    ],
  },
  {
    id: "pricing",
    title: "Pricing",
    items: [
      {
        q: "How do subscriptions work?",
        a: "Plans are monthly after a one-time implementation fee. Each tier includes a defined module set, user seats, and support level. Enterprise terms are available for multi-entity groups with custom SLAs.",
      },
      {
        q: "Is there a free trial?",
        a: "Yes. You can start a free trial to explore the platform. For production deployments with migration and training, we recommend booking a demo so implementation scope is aligned before go-live.",
      },
      {
        q: "What's included in implementation?",
        a: "Implementation covers discovery, configuration, core data setup, role mapping, training, and go-live support. Scope is confirmed after business analysis—complex multi-location rollouts may include phased deployment.",
      },
    ],
  },
  {
    id: "integrations",
    title: "Integrations",
    items: [
      {
        q: "Can I connect my existing POS?",
        a: "Busal includes native POS, which is the recommended path for unified operations. Where needed, integrations and migration paths exist for common systems—scope is confirmed during implementation planning.",
      },
      {
        q: "Do you offer API access?",
        a: "Yes. Busal provides REST APIs, webhooks, and SDKs for orders, customers, inventory, and events. Developer documentation covers authentication, rate limits, and integration patterns.",
      },
      {
        q: "Which payment providers are supported?",
        a: "Busal integrates with major payment processors including Stripe. Regional and enterprise payment requirements are scoped during onboarding.",
      },
    ],
  },
  {
    id: "security",
    title: "Security",
    items: [
      {
        q: "How secure is my data?",
        a: "Data is encrypted in transit and at rest. Access follows role-based permissions with audit logging. Infrastructure is monitored continuously with hardened security headers and tenant isolation.",
      },
      {
        q: "Where is data stored?",
        a: "Production data is hosted in secure cloud infrastructure with regional options for enterprise customers. Data residency requirements are addressed during enterprise scoping.",
      },
      {
        q: "Do you support SSO?",
        a: "Enterprise plans include SSO integration options. Standard plans use secure email-based authentication with optional MFA for administrative roles.",
      },
    ],
  },
  {
    id: "support",
    title: "Support",
    items: [
      {
        q: "What support channels are available?",
        a: "Customers access the Help Center, email support at support@getbusal.com, and live chat during business hours. Implementation customers receive dedicated onboarding support through go-live.",
      },
      {
        q: "How long does onboarding take?",
        a: "Typical single-location onboarding takes two to four weeks from kickoff to go-live. Multi-location and enterprise deployments are phased based on complexity, usually four to twelve weeks.",
      },
      {
        q: "Do you offer training?",
        a: "Yes. Implementation includes role-based training for managers, floor staff, and back-of-house teams. Recorded guides and in-app help supplement live sessions.",
      },
    ],
  },
  {
    id: "billing",
    title: "Billing",
    items: [
      {
        q: "How am I billed?",
        a: "Subscriptions are billed monthly to the payment method on file. Implementation is invoiced separately at project kickoff unless enterprise terms specify otherwise.",
      },
      {
        q: "Can I change plans?",
        a: "Yes. Upgrades take effect immediately with prorated billing. Downgrades apply at the next billing cycle. Your account manager can advise on module implications.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept major credit cards and bank transfer for enterprise accounts. Invoices include VAT details for UK and international customers as applicable.",
      },
    ],
  },
  {
    id: "account",
    title: "Account",
    items: [
      {
        q: "Can we start with one location?",
        a: "Yes. Most customers begin with a single branch, then expand modules and locations as operations mature. Your account scales without re-platforming.",
      },
      {
        q: "How do roles and permissions work?",
        a: "Busal uses role-based access at business and location levels. Administrators assign roles for managers, staff, kitchen, and finance—with granular module permissions.",
      },
      {
        q: "Can I invite my team during trial?",
        a: "Yes. Trial accounts support team invitations so you can evaluate Busal with the people who will operate it daily.",
      },
    ],
  },
  {
    id: "restaurants",
    title: "Restaurants",
    items: [
      {
        q: "Do you replace our POS and CRM?",
        a: "Busal is designed as the operating system—POS, CRM, inventory, kitchen display, and customer portal work together natively. This eliminates sync issues between disconnected tools.",
      },
      {
        q: "Does Busal support QR ordering?",
        a: "Yes. QR ordering connects guest menus, cart, and kitchen queues in one flow. Orders appear on POS and kitchen display without manual re-entry.",
      },
      {
        q: "Can Busal handle busy service periods?",
        a: "Busal is built for live service pressure—kitchen routing, order pacing, and real-time inventory updates are core to the platform, not add-ons.",
      },
    ],
  },
  {
    id: "retail",
    title: "Retail",
    items: [
      {
        q: "Does Busal work for retail operations?",
        a: "Yes. Retail modules cover inventory, POS checkout, customer profiles, and loyalty—configured for product-based operations rather than table service.",
      },
      {
        q: "Can retail and F&B run on one account?",
        a: "Multi-concept groups can run different module configurations per location under one business hierarchy with consolidated reporting.",
      },
    ],
  },
  {
    id: "enterprise",
    title: "Enterprise",
    items: [
      {
        q: "Can I use Busal internationally?",
        a: "Yes. Busal supports multi-currency operations, international payment methods, and regional compliance configurations. Enterprise scoping covers data residency and local requirements.",
      },
      {
        q: "What enterprise SLAs are available?",
        a: "Enterprise plans include priority support, dedicated success management, custom implementation timelines, and SLA-backed uptime commitments.",
      },
      {
        q: "Do you support franchise groups?",
        a: "Yes. Franchise and multi-brand operators use hierarchical permissions, consolidated analytics, and location-level autonomy within a single platform.",
      },
    ],
  },
] as const;

export const FAQ_TOP_QUESTIONS: readonly FaqItem[] = [
  {
    q: "What is Busal OS?",
    a: "Busal OS is an AI-powered operating system for service businesses. It unifies POS, CRM, inventory, kitchen operations, customer portal, and domain-specific AI agents—replacing fragmented tool stacks with one platform built for live operations.",
  },
  {
    q: "How long does onboarding take?",
    a: "Single-location onboarding typically takes two to four weeks from kickoff to go-live. Multi-location and enterprise deployments are phased over four to twelve weeks depending on complexity, migration scope, and training requirements.",
  },
  {
    q: "Can I migrate from another system?",
    a: "Yes. Implementation includes migration planning for customers, menus, inventory, and historical data. Your implementation specialist confirms scope based on your current systems and data quality during discovery.",
  },
  {
    q: "Does Busal support multiple locations?",
    a: "Yes. Busal supports multi-location hierarchies with branch permissions, consolidated reporting, and location-specific configurations. Enterprise plans add advanced org structures for franchise and group operators.",
  },
  {
    q: "Can I connect my existing POS?",
    a: "Busal includes native POS for unified operations. Where transition requires coexistence, integration paths are scoped during implementation. Most customers migrate fully to native POS for the best operational experience.",
  },
  {
    q: "How secure is my data?",
    a: "Data is encrypted in transit and at rest with tenant isolation, role-based access, and audit logging. Infrastructure is continuously monitored with hardened security controls appropriate for production business operations.",
  },
  {
    q: "Do you offer API access?",
    a: "Yes. REST APIs, webhooks, and TypeScript/Python SDKs are available for orders, customers, inventory, and events. Authentication uses API keys and OAuth with tenant-scoped access tokens.",
  },
  {
    q: "Can I use Busal internationally?",
    a: "Yes. Busal supports multi-currency, international payments, and regional compliance. Enterprise customers can discuss data residency and local regulatory requirements during scoping.",
  },
  {
    q: "How does AI work inside Busal?",
    a: "Domain AI agents—Manager, Reception, Marketing, and Operations—operate within your business context. They deliver briefings, answer operational questions, and assist workflows using live platform data, governed by your permissions.",
  },
] as const;

export const FAQ_MORE_HELP = [
  {
    title: "Help Center",
    desc: "Browse guides, tutorials, and documentation for every module.",
    href: "/help",
  },
  {
    title: "Contact Support",
    desc: "Email support@getbusal.com for technical and account issues.",
    href: "mailto:support@getbusal.com",
  },
  {
    title: "Book Demo",
    desc: "Guided walkthrough with a Busal platform specialist.",
    href: "/book-demo",
  },
  {
    title: "Talk to Sales",
    desc: "Pricing, enterprise plans, and implementation scoping.",
    href: "/contact",
  },
] as const;

export const FAQ_SEARCH_SUGGESTIONS = [
  "How long does onboarding take?",
  "Multi-location setup",
  "API and webhooks",
  "AI agents explained",
  "Pricing and plans",
] as const;

/** Flat list for SEO JSON-LD — deduplicated by question text */
export function getAllFaqItemsForSeo(): FaqItem[] {
  const seen = new Set<string>();
  const items: FaqItem[] = [];

  for (const category of FAQ_CATEGORIES) {
    for (const item of category.items) {
      if (!seen.has(item.q)) {
        seen.add(item.q);
        items.push(item);
      }
    }
  }

  for (const item of FAQ_TOP_QUESTIONS) {
    if (!seen.has(item.q)) {
      seen.add(item.q);
      items.push(item);
    }
  }

  return items;
}

export function getAllFaqItemsForSearch(): Array<FaqItem & { category: string }> {
  const items: Array<FaqItem & { category: string }> = [];

  for (const category of FAQ_CATEGORIES) {
    for (const item of category.items) {
      items.push({ ...item, category: category.title });
    }
  }

  for (const item of FAQ_TOP_QUESTIONS) {
    if (!items.some((i) => i.q === item.q)) {
      items.push({ ...item, category: "Top Questions" });
    }
  }

  return items;
}
