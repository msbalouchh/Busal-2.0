"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bot,
  ChevronDown,
  CreditCard,
  HelpCircle,
  Link2,
  MessageCircle,
  Rocket,
  Search,
  Shield,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { FadeIn, Reveal } from "@/modules/marketing/components/home/home-motion";
import {
  FAQ_CATEGORIES,
  FAQ_MORE_HELP,
  FAQ_POPULAR_TOPICS,
  FAQ_SEARCH_SUGGESTIONS,
  FAQ_TOP_QUESTIONS,
  getAllFaqItemsForSearch,
} from "@/modules/marketing/components/faq/faq-data";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";

import "@/modules/marketing/components/home/home.css";
import "./faq.css";

const TOPIC_ICONS = {
  rocket: Rocket,
  pricing: CreditCard,
  security: Shield,
  ai: Bot,
  support: MessageCircle,
  integrations: Link2,
} as const;

function FaqAccordionItem({
  q,
  a,
  defaultOpen = false,
  variant = "default",
}: {
  q: string;
  a: string;
  defaultOpen?: boolean;
  variant?: "default" | "premium";
}) {
  const [open, setOpen] = useState(defaultOpen);
  const reduced = useReducedMotion();

  return (
    <div
      className={cn(
        "fq-acc__item",
        variant === "premium" && "fq-acc__item--premium",
        open && "is-open",
      )}
    >
      <button
        type="button"
        className="fq-acc__trigger"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="fq-acc__question">{q}</span>
        <span className="fq-acc__chevron" aria-hidden="true">
          <ChevronDown className="h-5 w-5" />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="fq-acc__answer">{a}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function CategoryAccordion({
  title,
  items,
  defaultOpen = false,
}: {
  title: string;
  items: readonly { q: string; a: string }[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const reduced = useReducedMotion();

  return (
    <div className={cn("fq-cat__group", open && "is-open")}>
      <button
        type="button"
        className="fq-cat__trigger"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="fq-cat__title">{title}</span>
        <span className="fq-cat__count">{items.length} questions</span>
        <span className="fq-cat__chevron" aria-hidden="true">
          <ChevronDown className="h-5 w-5" />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="fq-cat__items">
              {items.map((item) => (
                <FaqAccordionItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function FaqPage() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});

  const allItems = useMemo(() => getAllFaqItemsForSearch(), []);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allItems.filter(
      (item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q),
    );
  }, [allItems, query]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...FAQ_SEARCH_SUGGESTIONS];
    return FAQ_SEARCH_SUGGESTIONS.filter((s) => s.toLowerCase().includes(q));
  }, [query]);

  const showSuggestions = focused && query.trim().length === 0 && suggestions.length > 0;
  const showResults = focused && query.trim().length > 0 && searchResults.length > 0;

  const scrollToCategory = (categoryId: string) => {
    categoryRefs.current[categoryId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="fq">
      {/* Section 1 — Hero */}
      <section className="fq-hero">
        <div className="fq-hero__glow" aria-hidden="true" />
        <div className="home-container">
          <FadeIn delay={0.04}>
            <span className="home-hero__badge">
              <HelpCircle className="h-3.5 w-3.5 text-[#8B5CF6]" aria-hidden="true" />
              FAQ
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="fq-hero__headline">Frequently Asked Questions</h1>
          </FadeIn>
          <FadeIn delay={0.16}>
            <p className="fq-hero__sub">
              Everything you need to know about Busal OS, our AI platform, pricing, onboarding,
              integrations, security and support.
            </p>
          </FadeIn>

          <FadeIn delay={0.22}>
            <div className="fq-search">
              <label htmlFor="fq-search-input" className="sr-only">
                Search frequently asked questions
              </label>
              <div
                className={cn("fq-search__shell", (showSuggestions || showResults) && "is-open")}
              >
                <Sparkles className="fq-search__ai" aria-hidden="true" />
                <input
                  id="fq-search-input"
                  type="search"
                  className="fq-search__input"
                  placeholder="Search questions about Busal OS…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => window.setTimeout(() => setFocused(false), 150)}
                  autoComplete="off"
                />
                <button type="button" className="fq-search__btn" aria-label="Search">
                  <Search className="h-4 w-4" aria-hidden="true" />
                </button>
                {showSuggestions ? (
                  <ul className="fq-search__dropdown" role="listbox">
                    {suggestions.map((item) => (
                      <li key={item}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={query === item}
                          className="fq-search__option"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setQuery(item);
                            setFocused(false);
                          }}
                        >
                          <Search className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {showResults ? (
                  <ul className="fq-search__dropdown" role="listbox">
                    {searchResults.slice(0, 6).map((item) => (
                      <li key={item.q}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={false}
                          className="fq-search__option fq-search__option--result"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setQuery(item.q);
                            setFocused(false);
                            document
                              .getElementById("top-questions")
                              ?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                        >
                          <strong>{item.q}</strong>
                          <span>{item.category}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.28}>
            <div className="home-hero__actions">
              <Link href={MARKETING_ROUTES.bookDemo} className="home-btn home-btn--primary">
                Book Demo
              </Link>
              <Link href={MARKETING_ROUTES.contact} className="home-btn home-btn--secondary">
                Contact Sales
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Section 2 — Popular Questions */}
      <section className="home-section home-section--tight" id="popular">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Popular Questions</p>
            <h2 className="home-title">Jump to what matters most.</h2>
          </Reveal>
          <div className="fq-popular">
            {FAQ_POPULAR_TOPICS.map((topic, i) => {
              const Icon = TOPIC_ICONS[topic.icon];
              return (
                <Reveal key={topic.title} delay={i * 0.04}>
                  <button
                    type="button"
                    className="fq-popular__card"
                    onClick={() => scrollToCategory(topic.categoryId)}
                  >
                    <span className="fq-popular__icon" aria-hidden="true">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3>{topic.title}</h3>
                    <p>{topic.summary}</p>
                  </button>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 3 — Interactive FAQ Categories */}
      <section className="home-section home-section--tight" id="categories">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Browse by Category</p>
            <h2 className="home-title">Interactive FAQ categories.</h2>
          </Reveal>
          <div className="fq-categories">
            {FAQ_CATEGORIES.map((category, i) => (
              <Reveal key={category.id} delay={i * 0.03}>
                <div
                  ref={(el) => {
                    categoryRefs.current[category.id] = el;
                  }}
                  id={`category-${category.id}`}
                >
                  <CategoryAccordion
                    title={category.title}
                    items={category.items}
                    defaultOpen={i === 0}
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — Top Questions */}
      <section className="home-section home-section--tight" id="top-questions">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Top Questions</p>
            <h2 className="home-title">Answers operators ask first.</h2>
          </Reveal>
          <div className="fq-top">
            {FAQ_TOP_QUESTIONS.map((item, i) => (
              <Reveal key={item.q} delay={i * 0.03}>
                <FaqAccordionItem q={item.q} a={item.a} defaultOpen={i === 0} variant="premium" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 — Need More Help? */}
      <section className="home-section home-section--tight" id="more-help">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Need More Help?</p>
            <h2 className="home-title">We&apos;re here when docs aren&apos;t enough.</h2>
          </Reveal>
          <div className="fq-help">
            {FAQ_MORE_HELP.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.05}>
                <Link href={item.href} className="fq-help__card">
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  <span className="fq-help__link">Learn more →</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6 — Still Have Questions? */}
      <section className="fq-cta" aria-labelledby="fq-cta-title">
        <div className="home-container">
          <Reveal>
            <div className="fq-cta__panel">
              <div className="fq-cta__glow fq-cta__glow--a" aria-hidden="true" />
              <div className="fq-cta__glow fq-cta__glow--b" aria-hidden="true" />
              <p className="home-eyebrow" style={{ position: "relative" }}>
                Get started
              </p>
              <h2 id="fq-cta-title" className="fq-cta__title">
                Let&apos;s Build Your Business Together.
              </h2>
              <p className="fq-cta__lead">
                Book a demo to see Busal OS configured for your operation—or start a free trial and
                explore the platform on your terms.
              </p>
              <div className="fq-cta__actions">
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
