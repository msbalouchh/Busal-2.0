import type { BLOG_POSTS } from "@/modules/marketing/content/site-copy";

export type BlogArticleSection = { heading?: string; paragraphs: string[] };

type BlogSlug = (typeof BLOG_POSTS)[number]["slug"];

export const BLOG_ARTICLE_BODIES: Record<BlogSlug, BlogArticleSection[]> = {
  "operating-system-vs-tool-stack": [
    {
      paragraphs: [
        "Most growing businesses start with best-of-breed tools: a POS here, a CRM there, inventory in a spreadsheet, and finance in yet another system. Each vendor optimizes its slice. Nobody owns the whole operation.",
        "The hidden cost is reconciliation. When guest counts in the CRM don't match covers in the POS, or inventory counts drift from what the kitchen actually used, teams spend hours fixing data instead of serving guests.",
      ],
    },
    {
      heading: "The operating system approach",
      paragraphs: [
        "An operating system model puts orders, customers, inventory, and finance on one data foundation. Changes propagate instantly—a loyalty redemption updates the guest profile, the order total, and the revenue report without manual exports.",
        "That isn't just convenience. It changes decision economics. Managers see one version of truth before service starts. AI briefings read live queues and revenue, not stale CSV uploads.",
      ],
    },
    {
      heading: "When to make the switch",
      paragraphs: [
        "The inflection point usually arrives with the second location or the first serious growth push. Tool stacks that worked for one branch become coordination overhead for two.",
        "Busal OS is built for that moment: start with core operations, expand modules and branches as the business matures—without re-implementing integrations every time.",
      ],
    },
  ],
  "ai-that-knows-your-service": [
    {
      paragraphs: [
        "Generic AI assistants are fluent and polite. They can draft an email or summarise a document. What they cannot do is tell you that table twelve's order is stalling the kitchen pass, or that your Tuesday lunch segment is down fourteen percent against last month.",
        "Service businesses need domain intelligence—AI that reads operational context, not just language.",
      ],
    },
    {
      heading: "Domain agents vs generic copilots",
      paragraphs: [
        "Busal's AI agents connect to live POS, kitchen, CRM, and inventory data. An operations agent sees queue depth and prep times. A finance agent sees invoice patterns and cashflow signals. A marketing agent sees segment performance grounded in actual visit history.",
        "Recommendations are scoped by your permission model—the same roles and branches that govern staff access govern what AI can see and suggest.",
      ],
    },
    {
      heading: "Briefings that matter before the rush",
      paragraphs: [
        "The highest-value AI moments happen before service pressure peaks: a morning briefing that flags low stock on a bestseller, a pipeline nudge for a corporate booking, or a staffing note tied to reservation volume.",
        "That is the difference between AI as novelty and AI as operating rhythm.",
      ],
    },
  ],
  "implementation-that-sticks": [
    {
      paragraphs: [
        "Software launches fail in the first two weeks—not because the product is wrong, but because teams revert to old habits when the new system feels unfamiliar under pressure.",
        "Implementation quality is measured by what happens after go-live, not the day credentials are sent.",
      ],
    },
    {
      heading: "Structure beats speed",
      paragraphs: [
        "Busal engagements follow a defined path: discovery, business analysis, configuration, training, go-live, and ongoing success. Each stage has clear owners and outcomes.",
        "Discovery maps branches, roles, menus, and priorities. Configuration aligns the platform to real workflows—not generic templates. Training focuses on the rhythms managers and floor staff will repeat daily.",
      ],
    },
    {
      heading: "Partnership, not a handoff",
      paragraphs: [
        "Go-live is supported, not abandoned. Customer success stays engaged as teams optimise with analytics and AI. The goal is operational clarity that compounds—not a login and a PDF.",
        "Businesses that invest in the first thirty days of operating rhythm see the strongest long-term adoption.",
      ],
    },
  ],
  "ai-for-restaurants": [
    {
      paragraphs: [
        "Restaurant AI fails when it lives in a chat window disconnected from the pass, the reservation book, and the margin report. Operators don't need poetry—they need signal before service.",
        "Busal's restaurant agents read live covers, kitchen queues, prep times, and sell-through to produce briefings managers can act on in minutes.",
      ],
    },
    {
      heading: "Pre-service intelligence",
      paragraphs: [
        "AI Manager summarises what changed since yesterday: VIP arrivals, low-stock mains, labour gaps against reservation load, and covers pacing against last week.",
        "Floor leads get the same context without chasing three systems—because POS, kitchen, CRM, and inventory already share one ledger.",
      ],
    },
    {
      heading: "During service, not after",
      paragraphs: [
        "Operations agents flag stalled tickets, pacing issues, and void patterns while service is live—not in a post-mortem spreadsheet the next morning.",
        "That is how AI earns trust on a Friday night: quiet when things are fine, precise when they are not.",
      ],
    },
  ],
  "retail-automation-without-chaos": [
    {
      paragraphs: [
        "Retail automation often means rules without context—auto-reorders that ignore promotions, or CRM segments that don't reflect what customers actually bought yesterday.",
        "Effective automation connects inventory, POS, and customer data so rules reflect live sell-through and visit behaviour.",
      ],
    },
    {
      heading: "Replenishment with guardrails",
      paragraphs: [
        "Busal triggers purchase suggestions from velocity, seasonality, and supplier lead times—while managers retain approval on high-value SKUs and promotional windows.",
        "Stock signals propagate to marketing segments so campaigns don't push products you cannot fulfil.",
      ],
    },
    {
      heading: "Automation that preserves judgment",
      paragraphs: [
        "The goal is fewer manual exports and fewer emergency transfers—not removing the merchant's eye from the floor.",
        "Operators configure thresholds, exceptions, and escalation paths so automation accelerates routine work without hiding risk.",
      ],
    },
  ],
  "business-intelligence-for-operators": [
    {
      paragraphs: [
        "Traditional BI arrives after close—pretty charts about yesterday. Operators need intelligence while decisions still matter: before the lunch rush, during a stock crisis, or when a promotion underperforms mid-week.",
        "Busal analytics sit on live operational data, not batch uploads.",
      ],
    },
    {
      heading: "One commercial view",
      paragraphs: [
        "Revenue, margin, labour, inventory, and guest metrics share one timeline. Branch managers see location detail; group leaders see consolidated roll-ups without reconciliation.",
        "AI Analytics narrates variance—explaining why Tuesday lunch diverged from forecast using actual order mix and staffing context.",
      ],
    },
    {
      heading: "From reporting to action",
      paragraphs: [
        "Dashboards link to workflows: low-stock alerts create draft purchase orders; segment dips suggest CRM campaigns; labour gaps tie to scheduling modules.",
        "Intelligence is useful when it closes the loop—not when it lives in a slide deck.",
      ],
    },
  ],
  "inventory-optimization-guide": [
    {
      paragraphs: [
        "Inventory drift is the silent tax on service businesses—bestsellers stock out, over-ordering ties up cash, and kitchen usage never quite matches what finance expected.",
        "Optimisation starts when purchase orders, kitchen consumption, and POS sell-through share one source of truth.",
      ],
    },
    {
      heading: "Signals that prevent stockouts",
      paragraphs: [
        "Busal monitors velocity, par levels, and supplier lead times to surface replenishment before service pressure exposes gaps.",
        "Multi-location operators see transfer suggestions when one branch has surplus and another faces a gap—without spreadsheet gymnastics.",
      ],
    },
    {
      heading: "Cost control without friction",
      paragraphs: [
        "Recipe-level costing ties menu engineering to actual usage. Waste and variance appear in dashboards managers review weekly—not quarterly.",
        "AI Inventory highlights anomalies: sudden spike in a high-cost ingredient, or a SKU that stopped moving despite marketing push.",
      ],
    },
  ],
  "crm-best-practices-service": [
    {
      paragraphs: [
        "CRM fails in service businesses when it is a database of names rather than a record of visits, preferences, and value. Every cover, appointment, or checkout should enrich the guest profile automatically.",
        "Busal CRM is native to POS and portal—no nightly sync jobs.",
      ],
    },
    {
      heading: "Profiles that update themselves",
      paragraphs: [
        "Orders, reservations, loyalty redemptions, and portal activity append to guest history in real time. Segments reflect behaviour as it happens—high-value lunch regulars, lapsed weekend visitors, corporate bookers.",
        "Marketing campaigns launch from live segments, not exported lists that were true three days ago.",
      ],
    },
    {
      heading: "Loyalty that feels operational",
      paragraphs: [
        "Rewards attach to the order flow—staff don't toggle between systems to honour points. Customers see balance and history in the portal without calling the desk.",
        "That is how CRM becomes a revenue tool instead of an admin burden.",
      ],
    },
  ],
  "staff-management-modern-ops": [
    {
      paragraphs: [
        "Multi-branch teams break when permissions are coarse—everyone is admin, or nobody can do what the shift requires. Modern operations need role clarity at business and location level.",
        "Busal maps roles to modules: floor, kitchen, finance, and management each see what they need—nothing more.",
      ],
    },
    {
      heading: "Permissions that scale",
      paragraphs: [
        "Administrators define role templates once, then assign per branch. New locations inherit governance without rebuilding access from scratch.",
        "Audit logs track sensitive actions—refunds, discount overrides, inventory adjustments—so accountability scales with the group.",
      ],
    },
    {
      heading: "Training aligned to roles",
      paragraphs: [
        "Implementation training mirrors permissions: managers learn briefings and dashboards; floor staff learn POS and guest flows; kitchen teams learn display rhythms.",
        "When access matches responsibility, adoption sticks under live service pressure.",
      ],
    },
  ],
  "analytics-that-drive-decisions": [
    {
      paragraphs: [
        "Analytics programs fail when metrics multiply but decisions don't. Operators need a short list of numbers that change behaviour same-day: cover pace, basket size, labour ratio, stock risk.",
        "Busal dashboards prioritise actionable KPIs over vanity totals.",
      ],
    },
    {
      heading: "Branch and group lenses",
      paragraphs: [
        "Location managers drill into shift performance. Group leaders compare branches on consistent definitions—same revenue rules, same labour calculations, same inventory valuation.",
        "No more arguing about which spreadsheet is correct.",
      ],
    },
    {
      heading: "AI narration on top of live data",
      paragraphs: [
        "AI Analytics explains variance in plain language: why margin dipped, which category drove traffic, where labour overshot reservation load.",
        "Narration turns dashboards into briefings operators actually read before doors open.",
      ],
    },
  ],
  "customer-loyalty-that-compounds": [
    {
      paragraphs: [
        "Loyalty programs decay when rewards feel disconnected from visits—points expire silently, balances disagree between till and app, and campaigns blast everyone the same offer.",
        "Compounding loyalty ties every visit to visible progress and relevant rewards.",
      ],
    },
    {
      heading: "Unified guest experience",
      paragraphs: [
        "Customers earn and redeem through POS, QR, and portal with one balance. Staff see loyalty status at checkout; guests see history and offers without calling support.",
        "Segments power personalised rewards—VIP tasting menus, win-back offers, birthday treats—grounded in actual visit data.",
      ],
    },
    {
      heading: "Measure retention, not just redemptions",
      paragraphs: [
        "Busal tracks visit frequency, spend lift, and cohort retention—not only points issued. Marketing sees which rewards change behaviour versus which subsidise existing habit.",
        "That is how loyalty becomes a growth lever with measurable ROI.",
      ],
    },
  ],
  "security-by-design-operators": [
    {
      paragraphs: [
        "Growing operators handle payment data, staff records, and guest profiles across locations. Security cannot be a post-launch patch—it must be architectural.",
        "Busal enforces tenant isolation, encryption, and role-based access from day one.",
      ],
    },
    {
      heading: "Access and audit",
      paragraphs: [
        "Permissions limit who can export data, issue refunds, or change billing. Audit logs capture administrative actions for review and compliance.",
        "Enterprise customers add SSO and advanced policy controls without a separate security product.",
      ],
    },
    {
      heading: "Operational trust",
      paragraphs: [
        "Uptime, monitoring, and hardened infrastructure protect live service—because a breach or outage during Saturday dinner is an operational crisis, not an IT ticket.",
        "Security posture should match the stakes of running real businesses on the platform.",
      ],
    },
  ],
  "busal-platform-summer-2026": [
    {
      paragraphs: [
        "Summer 2026 brings the most requested operator capabilities to general availability—AI briefings, multi-location intelligence, predictive inventory, and a refreshed customer portal.",
        "Each release closes a loop between modules rather than adding another standalone feature.",
      ],
    },
    {
      heading: "AI Manager briefings",
      paragraphs: [
        "Managers receive pre-service summaries: reservation load, margin signals, low-stock mains, and queue risk from yesterday's patterns.",
        "Briefings respect branch permissions—area managers see their locations; group leaders see roll-ups.",
      ],
    },
    {
      heading: "Multi-location dashboard",
      paragraphs: [
        "Consolidated commercial view with drill-down by branch, module, and time window. Compare performance without exporting to spreadsheets.",
        "Predictive inventory and portal refresh ship alongside—replenishment suggestions and guest self-service that reflect live platform data.",
      ],
    },
  ],
};
