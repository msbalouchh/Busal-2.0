"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  ChevronDown,
  Headphones,
  Plug,
  Shield,
  Sparkles,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { FadeIn, Reveal } from "@/modules/marketing/components/home/home-motion";
import {
  COMPARE_FEATURES,
  PRICING_FAQ,
  SETUP_ITEMS,
  type CompareValue,
  type PlanTier,
} from "@/modules/marketing/components/pricing/pricing-data";
import { PricingRoiCalculator } from "@/modules/marketing/components/pricing/pricing-roi";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";

import "@/modules/marketing/components/home/home.css";
import "./pricing.css";

const YEARLY_DISCOUNT = 0.17;

const PLANS = [
  {
    id: "starter" as const,
    name: "Starter",
    tagline: "Single location · Small businesses",
    monthly: 199,
    features: [
      "Core POS, orders & kitchen",
      "QR menu & basic reservations",
      "Essential CRM & inventory",
      "Standard reports & analytics",
      "Email support",
    ],
    ai: ["Standard AI assistant"],
    users: "Up to 10 users",
    locations: "1 location",
    cta: "Start Free Trial",
    ctaHref: ROUTES.signup,
    featured: false,
  },
  {
    id: "growth" as const,
    name: "Growth",
    tagline: "Growing businesses · AI automation",
    monthly: 349,
    features: [
      "Everything in Starter",
      "Multi-user collaboration",
      "CRM, loyalty & marketing campaigns",
      "Advanced analytics & reports",
      "Priority support",
    ],
    ai: ["AI Manager", "AI Marketing", "AI Operations", "Workflow automation"],
    users: "Up to 50 users",
    locations: "Up to 5 locations",
    cta: "Start Free Trial",
    ctaHref: ROUTES.signup,
    featured: true,
  },
  {
    id: "enterprise" as const,
    name: "Enterprise",
    tagline: "Multi-branch · Advanced AI · Custom scale",
    monthly: null,
    features: [
      "Everything in Growth",
      "Dedicated onboarding & success",
      "Custom integrations & API access",
      "SSO & enterprise security controls",
      "Volume pricing & custom SLAs",
    ],
    ai: ["Full AI agent suite", "Custom automations", "Executive AI briefings"],
    users: "Unlimited users",
    locations: "Unlimited locations",
    cta: "Talk to Sales",
    ctaHref: MARKETING_ROUTES.contact,
    featured: false,
  },
];

function formatPrice(amount: number, yearly: boolean) {
  if (yearly) {
    const discounted = Math.round(amount * (1 - YEARLY_DISCOUNT));
    return { display: `£${discounted}`, note: `Billed £${discounted * 12}/year · Save 17%` };
  }
  return { display: `£${amount}`, note: null as string | null };
}

function CompareCell({ value }: { value: CompareValue }) {
  if (value === true) return <span className="price-compare__yes">Yes</span>;
  if (value === false) return <span className="price-compare__no">—</span>;
  return <span>{value}</span>;
}

function FaqItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const reduced = useReducedMotion();

  return (
    <div className={cn("price-faq__item", open && "is-open")}>
      <button
        type="button"
        className="price-faq__trigger"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="price-faq__question">{q}</span>
        <span className="price-faq__chevron" aria-hidden="true">
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
            <p className="price-faq__answer">{a}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const [highlightPlan, setHighlightPlan] = useState<PlanTier>("growth");
  const reduced = useReducedMotion();

  return (
    <div className="price">
      {/* Hero */}
      <section className="price-hero">
        <div className="price-hero__glow" />
        <div className="home-container">
          <FadeIn delay={0.04}>
            <span className="home-hero__badge">
              <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" aria-hidden="true" />
              Pricing
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="price-hero__headline">
              Simple Pricing.
              <br />
              <span className="price-hero__accent">Powerful Business Growth.</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.18}>
            <p className="price-hero__desc">
              Start with everything you need. Scale as your business grows—without surprise fees or
              fragmented tool stacks.
            </p>
          </FadeIn>
          <FadeIn delay={0.26}>
            <div className="price-hero__actions">
              <Link href={ROUTES.signup} className="home-btn home-btn--primary">
                Start Free Trial
              </Link>
              <Link href={MARKETING_ROUTES.bookDemo} className="home-btn home-btn--secondary">
                Book a Demo
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Toggle + Plans */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <div className="price-toggle-wrap">
              <div className="price-toggle">
                <div className="price-toggle__track">
                  {!reduced ? (
                    <motion.div
                      className="price-toggle__pill"
                      layout
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      animate={{ left: yearly ? "calc(50%)" : "0.35rem" }}
                      initial={false}
                    />
                  ) : null}
                  <button
                    type="button"
                    className={cn("price-toggle__label", !yearly && "is-active")}
                    aria-pressed={!yearly}
                    onClick={() => setYearly(false)}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    className={cn("price-toggle__label", yearly && "is-active")}
                    aria-pressed={yearly}
                    onClick={() => setYearly(true)}
                  >
                    Yearly
                  </button>
                </div>
              </div>
              <p className="price-toggle__save">Save 17% with annual billing</p>
            </div>
          </Reveal>

          <div className="price-plans">
            {PLANS.map((plan, i) => {
              const pricing = plan.monthly !== null ? formatPrice(plan.monthly, yearly) : null;
              return (
                <Reveal key={plan.id} delay={i * 0.05}>
                  <article
                    className={cn("price-plan", plan.featured && "price-plan--featured")}
                    onMouseEnter={() => setHighlightPlan(plan.id)}
                  >
                    {plan.featured ? <span className="price-plan__badge">Recommended</span> : null}
                    <h2 className="price-plan__name">{plan.name}</h2>
                    <p className="price-plan__tagline">{plan.tagline}</p>
                    <p className="price-plan__amount">
                      {pricing ? (
                        <>
                          {pricing.display}
                          <span>/mo</span>
                        </>
                      ) : (
                        <>Custom</>
                      )}
                    </p>
                    {pricing?.note ? (
                      <p className="price-plan__annual-note">{pricing.note}</p>
                    ) : null}
                    <div className="price-plan__limits">
                      <span className="price-plan__limit">{plan.users}</span>
                      <span className="price-plan__limit">{plan.locations}</span>
                    </div>
                    <p className="price-plan__section-label">Features</p>
                    <ul className="price-plan__list">
                      {plan.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                    <p className="price-plan__section-label">AI capabilities</p>
                    <ul className="price-plan__list">
                      {plan.ai.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                    <Link
                      href={plan.ctaHref}
                      className={cn(
                        "home-btn price-plan__cta",
                        plan.featured ? "home-btn--primary" : "home-btn--secondary",
                      )}
                    >
                      {plan.cta}
                    </Link>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* One-Time Setup */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">One-Time Setup</p>
            <h2 className="home-title price-title--wide">
              Professional implementation by the Busal team.
            </h2>
            <p className="home-lead">
              Every customer starts with structured onboarding—not a login email and PDF. Our
              implementation specialists configure Busal for your exact operation.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="price-setup">
              <div className="price-setup__head">
                <div>
                  <p className="home-eyebrow" style={{ marginBottom: "0.5rem" }}>
                    Implementation
                  </p>
                  <h3 className="home-title" style={{ maxWidth: "none", fontSize: "1.75rem" }}>
                    One-time professional setup
                  </h3>
                  <p className="home-lead" style={{ marginTop: "0.75rem" }}>
                    Discovery, configuration, data setup, training, and go-live support tailored to
                    your business.
                  </p>
                </div>
                <p className="price-setup__range">£3,000–£4,000</p>
              </div>
              <div className="price-setup__grid">
                {SETUP_ITEMS.map((item) => (
                  <div key={item.title} className="price-setup__item">
                    <strong>{item.title}</strong>
                    <p>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Compare Plans */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Compare Plans</p>
            <h2 className="home-title">Every capability at a glance.</h2>
            <p className="home-lead">
              Select a plan to highlight its column, or scroll the full comparison on smaller
              screens.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="price-compare-wrap">
              <div
                className="price-compare__tabs"
                role="tablist"
                aria-label="Highlight plan column"
              >
                {(["starter", "growth", "enterprise"] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    role="tab"
                    aria-selected={highlightPlan === tier}
                    className={cn("price-compare__tab", highlightPlan === tier && "is-active")}
                    onClick={() => setHighlightPlan(tier)}
                  >
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </button>
                ))}
              </div>
              <div className="price-compare__scroll">
                <table className="price-compare__table">
                  <caption>Busal OS plan feature comparison</caption>
                  <thead>
                    <tr>
                      <th scope="col">Feature</th>
                      <th
                        scope="col"
                        className={highlightPlan === "starter" ? "is-highlight" : undefined}
                      >
                        Starter
                      </th>
                      <th
                        scope="col"
                        className={highlightPlan === "growth" ? "is-highlight" : undefined}
                      >
                        Growth
                      </th>
                      <th
                        scope="col"
                        className={highlightPlan === "enterprise" ? "is-highlight" : undefined}
                      >
                        Enterprise
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE_FEATURES.map((row) => (
                      <tr key={row.feature}>
                        <th scope="row">{row.feature}</th>
                        <td className={highlightPlan === "starter" ? "is-highlight" : undefined}>
                          <CompareCell value={row.starter} />
                        </td>
                        <td className={highlightPlan === "growth" ? "is-highlight" : undefined}>
                          <CompareCell value={row.growth} />
                        </td>
                        <td className={highlightPlan === "enterprise" ? "is-highlight" : undefined}>
                          <CompareCell value={row.enterprise} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">ROI Calculator</p>
            <h2 className="home-title price-title--wide">Estimate the value of one platform.</h2>
            <p className="home-lead">
              Adjust the sliders to see illustrative time, revenue, and labour impact—validated
              during your demo.
            </p>
          </Reveal>
          <PricingRoiCalculator />
        </div>
      </section>

      {/* FAQ */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">FAQ</p>
            <h2 className="home-title">Pricing questions, answered.</h2>
            <p className="home-lead">
              Billing, contracts, setup, migration, support, cancellation, AI, and security.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="price-faq">
              {PRICING_FAQ.map((item, i) => (
                <FaqItem key={item.q} q={item.q} a={item.a} defaultOpen={i === 0} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Enterprise Sales */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Enterprise Sales</p>
            <h2 className="home-title price-title--wide">Built for larger organisations.</h2>
            <p className="home-lead">
              Multi-branch groups, franchises, and enterprise operators get custom commercial terms
              and white-glove support.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="price-enterprise">
              <div className="price-enterprise__grid">
                {[
                  {
                    icon: Building2,
                    title: "Custom pricing",
                    desc: "Volume pricing and commercial terms aligned to your group structure.",
                  },
                  {
                    icon: UserCheck,
                    title: "Dedicated account manager",
                    desc: "A named success partner from onboarding through expansion.",
                  },
                  {
                    icon: Plug,
                    title: "Custom integrations",
                    desc: "API access, webhooks, and identity providers for your stack.",
                  },
                  {
                    icon: Shield,
                    title: "SLA & enterprise security",
                    desc: "Custom SLAs, SSO, audit trails, and governance controls.",
                  },
                ].map((item) => (
                  <div key={item.title} className="price-enterprise__item">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="price-enterprise__actions">
                <Link href={MARKETING_ROUTES.contact} className="home-btn home-btn--primary">
                  Talk to Sales
                </Link>
                <Link href={MARKETING_ROUTES.bookDemo} className="home-btn home-btn--secondary">
                  <Headphones className="h-4 w-4" aria-hidden="true" />
                  Book a Demo
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="price-cta" aria-labelledby="price-cta-title">
        <div className="home-container">
          <Reveal>
            <div className="price-cta__panel">
              <div className="price-cta__glow price-cta__glow--a" aria-hidden="true" />
              <div className="price-cta__glow price-cta__glow--b" aria-hidden="true" />
              <p className="home-eyebrow" style={{ position: "relative" }}>
                Get started
              </p>
              <h2 id="price-cta-title" className="price-cta__title">
                Ready to transform your business?
              </h2>
              <p className="price-cta__lead">
                Start your free trial, book a demo, or talk to sales—we&apos;ll recommend the right
                plan after understanding your operation.
              </p>
              <div className="price-cta__actions">
                <Link href={ROUTES.signup} className="home-btn home-btn--primary">
                  Start Free Trial
                </Link>
                <Link href={MARKETING_ROUTES.bookDemo} className="home-btn home-btn--secondary">
                  Book Demo
                </Link>
                <Link href={MARKETING_ROUTES.contact} className="home-btn home-btn--secondary">
                  Talk to Sales
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
