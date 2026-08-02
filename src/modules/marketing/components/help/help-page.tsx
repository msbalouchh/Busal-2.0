"use client";

import {
  ArrowRight,
  BookOpen,
  Bot,
  Building2,
  ChevronRight,
  Clock,
  Code2,
  CreditCard,
  HelpCircle,
  MessageCircle,
  Play,
  Rocket,
  Search,
  Sparkles,
  Store,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { FadeIn, Reveal } from "@/modules/marketing/components/home/home-motion";
import {
  HELP_CATEGORIES,
  HELP_DEV_DOCS,
  HELP_FEATURED_GUIDES,
  HELP_POPULAR_TOPICS,
  HELP_QUICK_ACTIONS,
  HELP_SEARCH_SUGGESTIONS,
  HELP_SUPPORT,
  HELP_VIDEOS,
} from "@/modules/marketing/components/help/help-data";
import { getHelpSearchItems } from "@/modules/marketing/components/help/help-guides";
import { MarketingCoverArt } from "@/modules/marketing/components/marketing-cover-art";
import { HelpSearchViz } from "@/modules/marketing/components/help/help-visuals";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";

import "@/modules/marketing/components/home/home.css";
import "./help.css";

const TOPIC_ICONS = {
  rocket: Rocket,
  pos: Store,
  crm: Users,
  ai: Bot,
  billing: CreditCard,
  business: Building2,
} as const;

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function HelpPage() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const allItems = useMemo(() => getHelpSearchItems(), []);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q),
    );
  }, [allItems, query]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...HELP_SEARCH_SUGGESTIONS];
    return HELP_SEARCH_SUGGESTIONS.filter((s) => s.toLowerCase().includes(q));
  }, [query]);

  const showSuggestions = focused && query.trim().length === 0 && suggestions.length > 0;
  const showResults = focused && query.trim().length > 0 && searchResults.length > 0;

  return (
    <div className="hc">
      {/* Section 1 — Hero */}
      <section className="hc-hero">
        <div className="hc-hero__glow" aria-hidden="true" />
        <div className="home-container">
          <div className="hc-hero__grid">
            <div>
              <FadeIn delay={0.04}>
                <span className="home-hero__badge">
                  <HelpCircle className="h-3.5 w-3.5 text-[#8B5CF6]" aria-hidden="true" />
                  Help Center
                </span>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 className="hc-hero__headline">How can we help?</h1>
              </FadeIn>
              <FadeIn delay={0.16}>
                <p className="home-hero__desc">
                  Search guides, tutorials, and documentation—or browse by topic. AI-assisted search
                  surfaces the most relevant answers for your operation.
                </p>
              </FadeIn>

              <FadeIn delay={0.22}>
                <div className="hc-search">
                  <label htmlFor="hc-search-input" className="sr-only">
                    Search help articles
                  </label>
                  <div
                    className={cn(
                      "hc-search__shell",
                      (showSuggestions || showResults) && "is-open",
                    )}
                  >
                    <Sparkles className="hc-search__ai" aria-hidden="true" />
                    <input
                      id="hc-search-input"
                      type="search"
                      className="hc-search__input"
                      placeholder="Search guides, topics, and troubleshooting…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onFocus={() => setFocused(true)}
                      onBlur={() => window.setTimeout(() => setFocused(false), 150)}
                      autoComplete="off"
                    />
                    <button type="button" className="hc-search__btn" aria-label="Search">
                      <Search className="h-4 w-4" aria-hidden="true" />
                    </button>
                    {showSuggestions ? (
                      <ul className="hc-search__suggestions" role="listbox">
                        {suggestions.map((item) => (
                          <li key={item}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={query === item}
                              className="hc-search__suggestion"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setQuery(item);
                                setFocused(false);
                                scrollToId("featured-guides");
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
                      <ul className="hc-search__suggestions" role="listbox">
                        {searchResults.slice(0, 6).map((item) => (
                          <li key={item.title}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={false}
                              className="hc-search__suggestion hc-search__suggestion--result"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setQuery(item.title);
                                setFocused(false);
                                scrollToId("featured-guides");
                              }}
                            >
                              <strong>{item.title}</strong>
                              <span>{item.topic}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <p className="hc-search__hint">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    AI-powered search across {allItems.length} guides
                  </p>
                </div>
              </FadeIn>

              <FadeIn delay={0.28}>
                <div className="hc-quick">
                  {HELP_QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      className="hc-quick__chip"
                      onClick={() => scrollToId(action.href.replace("#", ""))}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </FadeIn>
            </div>
            <FadeIn delay={0.2}>
              <HelpSearchViz />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Section 2 — Popular Topics */}
      <section className="home-section home-section--tight" id="popular-topics">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Popular Topics</p>
            <h2 className="home-title">Start with what operators ask most.</h2>
          </Reveal>
          <div className="hc-topics">
            {HELP_POPULAR_TOPICS.map((topic, i) => {
              const Icon = TOPIC_ICONS[topic.icon];
              return (
                <Reveal key={topic.title} delay={i * 0.04}>
                  <article className="hc-topics__card">
                    <span className="hc-topics__icon" aria-hidden="true">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3>{topic.title}</h3>
                    <p>{topic.summary}</p>
                    <button
                      type="button"
                      className="hc-topics__link"
                      onClick={() => scrollToId("featured-guides")}
                    >
                      View guides
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 3 — Browse Categories */}
      <section className="home-section home-section--tight" id="categories">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Browse Categories</p>
            <h2 className="home-title">Every module, documented.</h2>
          </Reveal>
          <div className="hc-categories">
            {HELP_CATEGORIES.map((cat, i) => (
              <Reveal key={cat.title} delay={i * 0.03}>
                <button
                  type="button"
                  className="hc-categories__card"
                  onClick={() => scrollToId("featured-guides")}
                >
                  <div className="hc-categories__head">
                    <strong>{cat.title}</strong>
                    <span>{cat.articles} articles</span>
                  </div>
                  <p>{cat.desc}</p>
                  <ChevronRight className="hc-categories__arrow" aria-hidden="true" />
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — Featured Guides */}
      <section className="home-section home-section--tight" id="featured-guides">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Featured Guides</p>
            <h2 className="home-title">Premium documentation for operators.</h2>
          </Reveal>
          <div className="hc-guides">
            {HELP_FEATURED_GUIDES.map((guide, i) => (
              <Reveal key={guide.title} delay={i * 0.04}>
                <article className="hc-guides__card">
                  <div className="hc-guides__meta">
                    <span className="hc-guides__topic">{guide.topic}</span>
                    <span className="hc-guides__time">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {guide.readTime}
                    </span>
                  </div>
                  <h3>{guide.title}</h3>
                  <p>{guide.summary}</p>
                  <Link
                    href={
                      guide.slug ? `${MARKETING_ROUTES.blog}/${guide.slug}` : MARKETING_ROUTES.help
                    }
                    className="hc-guides__link"
                  >
                    Read guide
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 — Video Tutorials */}
      <section className="home-section home-section--tight" id="videos">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Video Tutorials</p>
            <h2 className="home-title">Learn visually, step by step.</h2>
          </Reveal>
          <div className="hc-videos">
            {HELP_VIDEOS.map((video, i) => (
              <Reveal key={video.title} delay={i * 0.05}>
                <article className="hc-videos__card">
                  <div className="hc-videos__media">
                    <MarketingCoverArt
                      variant={video.coverVariant}
                      gradient={video.gradient}
                      label={video.topic}
                      className="hc-videos__thumb-art"
                      size="md"
                    />
                    <span className="hc-videos__play" aria-hidden="true">
                      <Play className="h-5 w-5 fill-white text-white" />
                    </span>
                    <span className="hc-videos__duration">{video.duration}</span>
                  </div>
                  <div className="hc-videos__body">
                    <span className="hc-videos__topic">{video.topic}</span>
                    <h3>{video.title}</h3>
                    <Link href={MARKETING_ROUTES.resources} className="hc-videos__link">
                      Watch tutorial
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6 — Developer Documentation */}
      <section className="home-section home-section--tight" id="developer">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Developer Documentation</p>
            <h2 className="home-title">Build on Busal OS.</h2>
          </Reveal>
          <div className="hc-dev">
            {HELP_DEV_DOCS.map((doc, i) => (
              <Reveal key={doc.title} delay={i * 0.04}>
                <Link href={doc.href} className="hc-dev__card">
                  <Code2 className="hc-dev__icon" aria-hidden="true" />
                  <div>
                    <strong>{doc.title}</strong>
                    <p>{doc.desc}</p>
                  </div>
                  <ArrowRight className="hc-dev__arrow" aria-hidden="true" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7 — Still Need Help? */}
      <section className="home-section home-section--tight" id="still-need-help">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Still Need Help?</p>
            <h2 className="home-title">Talk to a human when you need to.</h2>
          </Reveal>
          <div className="hc-support">
            {HELP_SUPPORT.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.05}>
                <Link href={item.href} className="hc-support__card">
                  <span className="hc-support__icon" aria-hidden="true">
                    {item.title === "Live Chat" ? (
                      <MessageCircle className="h-5 w-5" />
                    ) : item.title === "Email Support" ? (
                      <BookOpen className="h-5 w-5" />
                    ) : item.title === "Book Demo" ? (
                      <Zap className="h-5 w-5" />
                    ) : (
                      <Users className="h-5 w-5" />
                    )}
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  <span className="hc-support__response">{item.response}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Section 8 — Final CTA */}
      <section className="hc-cta" aria-labelledby="hc-cta-title">
        <div className="home-container">
          <Reveal>
            <div className="hc-cta__panel">
              <div className="hc-cta__glow hc-cta__glow--a" aria-hidden="true" />
              <div className="hc-cta__glow hc-cta__glow--b" aria-hidden="true" />
              <p className="home-eyebrow" style={{ position: "relative" }}>
                Expert guidance
              </p>
              <h2 id="hc-cta-title" className="hc-cta__title">
                Need expert guidance?
              </h2>
              <p className="hc-cta__lead">
                Our team helps operators deploy Busal OS across locations, modules, and
                integrations—without disrupting live service.
              </p>
              <div className="hc-cta__actions">
                <Link href={MARKETING_ROUTES.contact} className="home-btn home-btn--primary">
                  Talk to Sales
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
