"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  Car,
  ChevronDown,
  Cloud,
  Coffee,
  Cookie,
  CreditCard,
  Database,
  Dumbbell,
  Layers,
  Package,
  Pill,
  QrCode,
  Scissors,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Store,
  Truck,
  Users,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { FadeIn, Reveal } from "@/modules/marketing/components/home/home-motion";
import {
  IndustriesAdaptFlow,
  IndustriesHeroViz,
} from "@/modules/marketing/components/industries/industries-visuals";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";

import "@/modules/marketing/components/home/home.css";
import "./industries.css";

type IndustryId =
  | "restaurants"
  | "cafes"
  | "retail"
  | "supermarkets"
  | "salons"
  | "barbershops"
  | "clinics"
  | "pharmacies"
  | "gyms"
  | "hotels"
  | "food-trucks"
  | "bakeries"
  | "cloud-kitchens"
  | "car-washes"
  | "repair-shops"
  | "professional-services";

type Industry = {
  id: IndustryId;
  name: string;
  icon: typeof Store;
  description: string;
  pains: readonly string[];
  solutions: readonly string[];
  features: readonly string[];
};

const INDUSTRIES: Industry[] = [
  {
    id: "restaurants",
    name: "Restaurants",
    icon: UtensilsCrossed,
    description: "Full-service dining with menus, kitchen pressure, and guest loyalty at scale.",
    pains: [
      "Kitchen bottlenecks during peak service",
      "Disconnected POS and reservations",
      "Margin blind spots until month-end",
    ],
    solutions: [
      "AI Manager briefs before every service",
      "Unified order flow from table to kitchen",
      "Live food cost and waste tracking",
    ],
    features: ["POS", "Kitchen Display", "Reservations", "QR Menu", "Delivery"],
  },
  {
    id: "cafes",
    name: "Cafés",
    icon: Coffee,
    description: "Fast-turn coffee and light bites with repeat customers and mobile ordering.",
    pains: ["Morning rush queue chaos", "Manual loyalty punch cards", "Stock-outs on bestsellers"],
    solutions: [
      "Quick POS built for high throughput",
      "CRM that remembers regulars",
      "AI Inventory predicts daily demand",
    ],
    features: ["POS", "QR Ordering", "Loyalty", "Inventory", "CRM"],
  },
  {
    id: "retail",
    name: "Retail Stores",
    icon: Store,
    description: "Brick-and-mortar retail with catalog, checkout, and customer retention.",
    pains: [
      "Sell-through data arrives too late",
      "Stockouts on popular SKUs",
      "No unified customer view",
    ],
    solutions: [
      "Live inventory tied to every sale",
      "Smart replenishment alerts",
      "Loyalty and CRM beside checkout",
    ],
    features: ["Inventory", "Barcode", "POS", "Stock Alerts", "CRM"],
  },
  {
    id: "supermarkets",
    name: "Supermarkets",
    icon: ShoppingCart,
    description: "High-volume grocery with multi-aisle inventory and supplier coordination.",
    pains: [
      "Complex supplier ordering cycles",
      "Shrink and waste hard to track",
      "Multi-branch stock visibility gaps",
    ],
    solutions: [
      "Purchase orders driven by sell-through",
      "AI waste and margin analytics",
      "Branch-level inventory control",
    ],
    features: ["Inventory", "Suppliers", "POS", "Reports", "Multi-branch"],
  },
  {
    id: "salons",
    name: "Salons",
    icon: Scissors,
    description: "Beauty and wellness with appointments, chair utilisation, and retail attach.",
    pains: [
      "Empty chairs between bookings",
      "Client history scattered across tools",
      "Retail add-ons under-tracked",
    ],
    solutions: [
      "Smart booking and rebooking nudges",
      "Client profiles inform every visit",
      "Campaigns grounded in visit data",
    ],
    features: ["Appointments", "Staff", "Payments", "CRM", "Marketing"],
  },
  {
    id: "barbershops",
    name: "Barbershops",
    icon: Scissors,
    description: "Walk-ins and bookings with fast checkout and repeat client relationships.",
    pains: [
      "Walk-in wait times feel unpredictable",
      "No-shows hurt chair revenue",
      "Tips and payments reconciled manually",
    ],
    solutions: [
      "Queue and booking in one view",
      "Automated appointment reminders",
      "Integrated payments and receipts",
    ],
    features: ["Appointments", "POS", "CRM", "Staff", "Loyalty"],
  },
  {
    id: "clinics",
    name: "Clinics",
    icon: Stethoscope,
    description: "Healthcare front desk with appointments, records workflows, and billing clarity.",
    pains: [
      "Phone tag for confirmations",
      "Front desk overwhelmed at peak hours",
      "Follow-ups fall through cracks",
    ],
    solutions: [
      "AI Receptionist handles booking queries",
      "Clear appointment status for staff",
      "Automated patient follow-up trails",
    ],
    features: ["Appointments", "Patients", "Billing", "Reports", "CRM"],
  },
  {
    id: "pharmacies",
    name: "Pharmacies",
    icon: Pill,
    description: "Dispensing and retail with inventory compliance and customer care.",
    pains: [
      "Stock expiry and reorder complexity",
      "Prescription queue bottlenecks",
      "Limited customer engagement tools",
    ],
    solutions: [
      "Inventory alerts before stockouts",
      "Streamlined checkout and queue",
      "CRM for repeat prescriptions and care",
    ],
    features: ["Inventory", "POS", "Patients", "Reports", "CRM"],
  },
  {
    id: "gyms",
    name: "Gyms",
    icon: Dumbbell,
    description: "Memberships, classes, and member engagement in one operational rhythm.",
    pains: [
      "Churn visible only after cancellation",
      "Class scheduling conflicts",
      "Membership billing disputes",
    ],
    solutions: [
      "Retention signals before churn",
      "Scheduling aligned to peak demand",
      "Self-serve member portal and billing",
    ],
    features: ["Memberships", "Scheduling", "CRM", "Payments", "Analytics"],
  },
  {
    id: "hotels",
    name: "Hotels",
    icon: Building2,
    description: "Guest journeys across reservations, housekeeping, F&B, and front desk.",
    pains: [
      "Guest preferences lost between departments",
      "RevPAR insights arrive late",
      "Ops and finance on different systems",
    ],
    solutions: [
      "Guest profiles follow the entire stay",
      "AI briefings on occupancy and demand",
      "Unified commercial and ops view",
    ],
    features: ["Reservations", "CRM", "POS", "Housekeeping", "Reports"],
  },
  {
    id: "food-trucks",
    name: "Food Trucks",
    icon: Truck,
    description: "Mobile food service with location-aware ops and fast order capture.",
    pains: [
      "Cash and card reconciliation on the road",
      "Menu changes hard to sync",
      "No customer data between locations",
    ],
    solutions: [
      "Mobile POS with offline resilience",
      "QR menus updated instantly",
      "Loyalty that travels with your brand",
    ],
    features: ["POS", "QR Menu", "Payments", "Inventory", "CRM"],
  },
  {
    id: "bakeries",
    name: "Bakeries",
    icon: Cookie,
    description: "Fresh production with pre-orders, wholesale, and retail counters.",
    pains: [
      "Over-production and waste daily",
      "Pre-order and walk-in conflict",
      "Wholesale invoicing manual",
    ],
    solutions: [
      "AI demand forecast for bake batches",
      "Pre-orders sync to production queue",
      "Finance and invoicing in one place",
    ],
    features: ["Pre-orders", "Inventory", "POS", "Production", "Finance"],
  },
  {
    id: "cloud-kitchens",
    name: "Cloud Kitchens",
    icon: Cloud,
    description: "Delivery-first kitchens with multi-brand order routing and cost control.",
    pains: [
      "Delivery platform orders scattered",
      "Brand-level margin invisible",
      "Kitchen queue overload at peak",
    ],
    solutions: [
      "All delivery channels into one queue",
      "Per-brand P&L and food cost",
      "AI staffing for delivery peaks",
    ],
    features: ["Kitchen Display", "Orders", "Inventory", "Multi-brand", "Analytics"],
  },
  {
    id: "car-washes",
    name: "Car Washes",
    icon: Car,
    description: "Membership washes, queue management, and location operations.",
    pains: [
      "Membership renewals missed",
      "Peak queue frustration",
      "Multi-site performance opaque",
    ],
    solutions: [
      "Automated membership billing",
      "Live queue and bay utilisation",
      "Branch dashboards for owners",
    ],
    features: ["Memberships", "POS", "Queue", "CRM", "Reports"],
  },
  {
    id: "repair-shops",
    name: "Repair Shops",
    icon: Wrench,
    description: "Auto, device, and equipment repair with job tracking and parts inventory.",
    pains: [
      "Job status updates by phone",
      "Parts ordering delays repairs",
      "Quotes and invoices disconnected",
    ],
    solutions: [
      "Job pipeline with customer notifications",
      "Inventory tied to open jobs",
      "Quotes convert to invoices seamlessly",
    ],
    features: ["Job Tracking", "Inventory", "CRM", "Invoicing", "Reports"],
  },
  {
    id: "professional-services",
    name: "Professional Services",
    icon: Briefcase,
    description: "Consultancies and service firms with CRM, delivery, billing, and client portals.",
    pains: [
      "Status updates buried in email",
      "Billing disconnected from delivery",
      "Pipeline visibility for partners",
    ],
    solutions: [
      "Client portals reduce status chases",
      "Time, delivery, and invoices on one timeline",
      "AI briefings on portfolio health",
    ],
    features: ["CRM", "Projects", "Invoicing", "Portal", "AI Assistant"],
  },
];

const FEATURE_ICONS: Record<string, typeof Store> = {
  POS: CreditCard,
  "Kitchen Display": Layers,
  Reservations: CalendarDays,
  "QR Menu": QrCode,
  Delivery: Truck,
  "QR Ordering": QrCode,
  Loyalty: Sparkles,
  Inventory: Package,
  CRM: Users,
  Barcode: QrCode,
  "Stock Alerts": Package,
  Suppliers: Database,
  Reports: BarChart3,
  "Multi-branch": Building2,
  Appointments: CalendarDays,
  Staff: Users,
  Payments: CreditCard,
  Marketing: Sparkles,
  Patients: Stethoscope,
  Billing: CreditCard,
  Memberships: Users,
  Scheduling: CalendarDays,
  Analytics: BarChart3,
  Housekeeping: Building2,
  "Pre-orders": CalendarDays,
  Production: Layers,
  Finance: CreditCard,
  Orders: ShoppingCart,
  "Multi-brand": Cloud,
  Queue: Users,
  "Job Tracking": Wrench,
  Invoicing: CreditCard,
  Projects: Briefcase,
  Portal: Users,
  "AI Assistant": Sparkles,
};

const FEATURE_TABS: IndustryId[] = ["restaurants", "retail", "salons", "clinics"];

const COMPARE_ROWS = [
  ["Industry fit", "Generic templates for everyone", "Configured for your business type"],
  ["Daily operations", "Manual exports and spreadsheets", "Modules and AI on live data"],
  ["Automation", "Zapier glue between tools", "Native workflows across Busal"],
  ["Intelligence", "Static dashboards only", "AI recommendations that learn"],
  ["Multi-location", "Bolted on at extra cost", "Built in from day one"],
  ["Total cost", "Multiple subscriptions", "One operating system"],
] as const;

const SUCCESS_METRICS = [
  {
    value: "38%",
    label: "Faster ticket times",
    industry: "Restaurants",
    summary: "Harbour Kitchen Group unified POS, kitchen, and loyalty across three coastal sites.",
  },
  {
    value: "22%",
    label: "Fewer stockouts",
    industry: "Retail",
    summary: "Northline Retail connects inventory, checkout, and CRM on one live ledger.",
  },
  {
    value: "2.1×",
    label: "Faster front-desk flow",
    industry: "Clinics",
    summary: "Atlas Clinics reduced phone tag with connected appointments and follow-ups.",
  },
  {
    value: "31%",
    label: "Rebooking lift",
    industry: "Salons",
    summary: "Velvet Salons increased repeat visits with AI-driven appointment nudges.",
  },
  {
    value: "14%",
    label: "Waste reduction",
    industry: "Food service",
    summary: "Multi-site operators cut food waste with AI Inventory demand forecasting.",
  },
  {
    value: "£124k",
    label: "Monthly revenue tracked",
    industry: "Multi-industry",
    summary: "Growing groups run finance, ops, and AI intelligence from one platform.",
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "Is Busal OS only built for restaurants?",
    a: "Restaurants are our deepest vertical today, but the platform serves cafés, retail, salons, clinics, hotels, gyms, and professional services on the same foundation—with industry-specific configuration, not a generic template.",
  },
  {
    q: "Can I run multiple business types on one account?",
    a: "Yes. Multi-tenant architecture supports groups with different concepts—restaurant plus retail, hotel plus F&B—with branch-level permissions and shared or separate reporting.",
  },
  {
    q: "How long does industry configuration take?",
    a: "Most businesses go live within four weeks after discovery. We map your workflows, modules, and AI agents to your industry during structured implementation—not a self-serve login email.",
  },
  {
    q: "Does AI understand my industry's daily rhythms?",
    a: "Busal AI agents operate on live operational data from your modules—covers and kitchen queues for restaurants, chair utilisation for salons, appointment flow for clinics—so recommendations arrive with context.",
  },
  {
    q: "What if my industry isn't listed?",
    a: "Professional services, repair shops, car washes, and cloud kitchens already run on Busal. Book a demo and we'll map your operation—most service businesses fit the same operating system spine.",
  },
] as const;

function FaqItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const reduced = useReducedMotion();

  return (
    <div className={cn("ind-faq__item", open && "is-open")}>
      <button
        type="button"
        className="ind-faq__trigger"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="ind-faq__question">{q}</span>
        <span className="ind-faq__chevron" aria-hidden="true">
          <ChevronDown className="h-5 w-5" />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="ind-faq__answer">{a}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function IndustriesPage() {
  const [selectedId, setSelectedId] = useState<IndustryId>("restaurants");
  const featuresRef = useRef<HTMLElement>(null);

  const selected = INDUSTRIES.find((ind) => ind.id === selectedId) ?? INDUSTRIES[0]!;

  const selectIndustry = useCallback((id: IndustryId) => {
    setSelectedId(id);
  }, []);

  const handleCardClick = useCallback(
    (id: IndustryId) => {
      selectIndustry(id);
      featuresRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [selectIndustry],
  );

  return (
    <div className="ind">
      {/* Hero */}
      <section className="ind-hero">
        <div className="ind-hero__glow" />
        <div className="home-container">
          <div className="ind-hero__grid">
            <div>
              <FadeIn delay={0.04}>
                <span className="home-hero__badge">
                  <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" aria-hidden="true" />
                  Industries
                </span>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 className="ind-hero__headline">
                  One AI Operating System.
                  <br />
                  <span className="ind-hero__accent">Built for Every Business.</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.18}>
                <p className="home-hero__desc">
                  Whether you run a restaurant, retail store, salon, clinic, or service business,
                  Busal adapts to your operations with intelligent automation—so you spend less time
                  on admin and more time growing revenue.
                </p>
              </FadeIn>
              <FadeIn delay={0.26}>
                <div className="home-hero__actions">
                  <Link href={MARKETING_ROUTES.bookDemo} className="home-btn home-btn--primary">
                    Book Demo
                  </Link>
                  <Link href={ROUTES.signup} className="home-btn home-btn--secondary">
                    Start Free Trial
                  </Link>
                </div>
              </FadeIn>
            </div>
            <FadeIn delay={0.2}>
              <IndustriesHeroViz />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="home-section" id="industries-grid">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Industries</p>
            <h2 className="home-title ind-title--wide">Find your business. See how Busal fits.</h2>
            <p className="home-lead">
              Sixteen verticals on one platform—each with industry-specific modules, AI agents, and
              automation configured for how you actually operate.
            </p>
          </Reveal>
          <div className="ind-grid">
            {INDUSTRIES.map((industry, i) => (
              <Reveal key={industry.id} delay={i * 0.02}>
                <article
                  className={cn("ind-card", selectedId === industry.id && "is-active")}
                  onClick={() => handleCardClick(industry.id)}
                >
                  <span className="ind-card__icon" aria-hidden="true">
                    <industry.icon className="h-5 w-5" />
                  </span>
                  <h3 className="ind-card__title">{industry.name}</h3>
                  <p className="ind-card__desc">{industry.description}</p>

                  <div className="ind-card__section">
                    <p className="ind-card__label">Pain points</p>
                    <ul className="ind-card__list">
                      {industry.pains.map((pain) => (
                        <li key={pain}>{pain}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="ind-card__section">
                    <p className="ind-card__label">Busal AI solutions</p>
                    <ul className="ind-card__list ind-card__list--solution">
                      {industry.solutions.map((solution) => (
                        <li key={solution}>{solution}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="ind-card__section">
                    <p className="ind-card__label">Key features</p>
                    <div className="ind-card__features">
                      {industry.features.map((feature) => (
                        <span key={feature} className="ind-card__feature">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={MARKETING_ROUTES.bookDemo}
                    className="ind-card__cta"
                    onClick={(event) => event.stopPropagation()}
                  >
                    Learn More
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How Busal Adapts */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">How Busal Adapts</p>
            <h2 className="home-title">From business type to intelligent operations.</h2>
            <p className="home-lead">
              Busal configures the right modules, AI agents, and automations for your industry—then
              compounds insights as your data grows.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <IndustriesAdaptFlow />
          </Reveal>
        </div>
      </section>

      {/* Industry Features */}
      <section className="home-section" id="industry-features" ref={featuresRef}>
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Industry Features</p>
            <h2 className="home-title ind-title--wide">
              The right modules for your business type.
            </h2>
            <p className="home-lead">
              Select an industry to see the feature combination Busal configures—native modules, not
              bolted-on integrations.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="ind-features">
              <div className="ind-features__tabs" role="tablist" aria-label="Industry features">
                {FEATURE_TABS.map((tabId) => {
                  const tab = INDUSTRIES.find((ind) => ind.id === tabId)!;
                  return (
                    <button
                      key={tabId}
                      type="button"
                      role="tab"
                      aria-selected={selectedId === tabId}
                      className={cn("ind-features__tab", selectedId === tabId && "is-active")}
                      onClick={() => selectIndustry(tabId)}
                    >
                      {tab.name}
                    </button>
                  );
                })}
                {!FEATURE_TABS.includes(selectedId) ? (
                  <button
                    type="button"
                    role="tab"
                    aria-selected
                    className="ind-features__tab is-active"
                  >
                    {selected.name}
                  </button>
                ) : null}
              </div>
              <div className="ind-features__body" role="tabpanel">
                <h3 className="ind-features__title">{selected.name} module stack</h3>
                <p className="ind-features__desc">{selected.description}</p>
                <div className="ind-features__chips">
                  {selected.features.map((feature) => {
                    const Icon = FEATURE_ICONS[feature] ?? Layers;
                    return (
                      <span key={feature} className="ind-features__chip">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {feature}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Why Businesses Choose Busal */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Why Businesses Choose Busal</p>
            <h2 className="home-title">Traditional software vs Busal AI Operating System.</h2>
            <p className="home-lead">
              Industry tools promise vertical depth but fragment your data. Busal gives you both—
              native industry modules on one intelligent spine.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="ind-compare">
              <div className="ind-compare__head">
                <span>Capability</span>
                <span>Traditional software</span>
                <span>Busal AI OS</span>
              </div>
              {COMPARE_ROWS.map(([cap, trad, busal]) => (
                <div key={cap} className="ind-compare__row">
                  <span>{cap}</span>
                  <span>{trad}</span>
                  <span>{busal}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Customer Success */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Customer Success</p>
            <h2 className="home-title">Real growth across industries.</h2>
            <p className="home-lead">
              Operators measure impact in faster service, fewer stockouts, and happier customers—
              not dashboard vanity metrics.
            </p>
          </Reveal>
          <div className="ind-success">
            {SUCCESS_METRICS.map((item, i) => (
              <Reveal key={item.label} delay={i * 0.04}>
                <article className="ind-success__card">
                  <p className="ind-success__metric">{item.value}</p>
                  <p className="ind-success__label">{item.label}</p>
                  <span className="ind-success__industry">{item.industry}</span>
                  <p className="ind-success__summary">{item.summary}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">FAQ</p>
            <h2 className="home-title ind-title--wide">Industry questions, answered.</h2>
            <p className="home-lead">
              Common questions from operators evaluating Busal for their vertical.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="ind-faq">
              {FAQ_ITEMS.map((item, i) => (
                <FaqItem key={item.q} q={item.q} a={item.a} defaultOpen={i === 0} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="ind-cta" aria-labelledby="ind-cta-title">
        <div className="home-container">
          <Reveal>
            <div className="ind-cta__panel">
              <div className="ind-cta__glow ind-cta__glow--a" aria-hidden="true" />
              <div className="ind-cta__glow ind-cta__glow--b" aria-hidden="true" />
              <p className="home-eyebrow" style={{ position: "relative" }}>
                Get started
              </p>
              <h2 id="ind-cta-title" className="ind-cta__title">
                Ready to modernize your business?
              </h2>
              <p className="ind-cta__lead">
                Book a demo tailored to your industry—or start your free trial and explore the
                platform today.
              </p>
              <div className="ind-cta__actions">
                <Link href={MARKETING_ROUTES.bookDemo} className="home-btn home-btn--primary">
                  Book Demo
                </Link>
                <Link href={ROUTES.signup} className="home-btn home-btn--secondary">
                  Start Free Trial
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
