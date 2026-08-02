"use client";

import { ArrowRight, BookOpen, Download } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { FadeIn, Reveal } from "@/modules/marketing/components/home/home-motion";
import { NewsletterForm } from "@/modules/marketing/components/newsletter-form";
import {
  ALL_RESOURCES,
  FEATURED_RESOURCES,
  FREE_DOWNLOADS,
  LEARNING_CENTER,
  LATEST_INSIGHTS,
  RESOURCE_CATEGORIES,
  type ResourceCategory,
} from "@/modules/marketing/components/resources/resources-data";
import { MarketingCoverArt } from "@/modules/marketing/components/marketing-cover-art";
import {
  ResourcesHeroViz,
  ResourcesVideoPreview,
} from "@/modules/marketing/components/resources/resources-visuals";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";

import "@/modules/marketing/components/home/home.css";
import "./resources.css";

function DownloadCard({ title, desc, format }: { title: string; desc: string; format: string }) {
  const [requested, setRequested] = useState(false);

  return (
    <article className="rs-downloads__card">
      <Download className="h-5 w-5" aria-hidden="true" />
      <strong>{title}</strong>
      <span className="rs-downloads__desc">{desc}</span>
      <span className="rs-downloads__format">{format}</span>
      {requested ? (
        <p className="rs-downloads__sent" role="status">
          Download link ready — check your inbox after subscribing below.
        </p>
      ) : (
        <button type="button" className="rs-downloads__btn" onClick={() => setRequested(true)}>
          Download
        </button>
      )}
    </article>
  );
}

export function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState<ResourceCategory | "All">("All");

  const filteredResources = useMemo(() => {
    if (activeCategory === "All") return ALL_RESOURCES;
    return ALL_RESOURCES.filter((r) => r.category === activeCategory);
  }, [activeCategory]);

  const scrollToResources = () => {
    document
      .getElementById("featured-resources")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="rs">
      {/* Hero */}
      <section className="rs-hero">
        <div className="rs-hero__glow" />
        <div className="home-container">
          <div className="rs-hero__grid">
            <div>
              <FadeIn delay={0.04}>
                <span className="home-hero__badge">
                  <BookOpen className="h-3.5 w-3.5 text-[#8B5CF6]" aria-hidden="true" />
                  Resources
                </span>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 className="rs-hero__headline">
                  Resources to Help Your
                  <br />
                  <span className="rs-hero__accent">Business Grow.</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.18}>
                <p className="home-hero__desc">
                  Explore expert guides, AI playbooks, business templates and best practices to get
                  the most from Busal OS.
                </p>
              </FadeIn>
              <FadeIn delay={0.26}>
                <div className="home-hero__actions">
                  <button
                    type="button"
                    className="home-btn home-btn--primary"
                    onClick={scrollToResources}
                  >
                    Browse Resources
                  </button>
                  <Link href={MARKETING_ROUTES.bookDemo} className="home-btn home-btn--secondary">
                    Book Demo
                  </Link>
                </div>
              </FadeIn>
            </div>
            <FadeIn delay={0.2}>
              <ResourcesHeroViz />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Featured Resources */}
      <section className="home-section home-section--tight" id="featured-resources">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Featured Resources</p>
            <h2 className="home-title rs-title--wide">
              {activeCategory === "All"
                ? "Start with our most popular guides."
                : `${activeCategory} resources.`}
            </h2>
          </Reveal>
          <div className="rs-featured">
            {(activeCategory === "All" ? FEATURED_RESOURCES : filteredResources).map((item, i) => (
              <Reveal key={item.id} delay={i * 0.03}>
                <article className="rs-featured__card">
                  <MarketingCoverArt
                    variant={item.coverVariant}
                    gradient={item.gradient}
                    label={item.type}
                    className="rs-featured__cover"
                    size="md"
                  />
                  <div className="rs-featured__body">
                    <span className="rs-featured__meta">
                      {item.readTime} · {item.category}
                    </span>
                    <h3>{item.title}</h3>
                    <Link href={item.href} className="rs-featured__cta">
                      {item.cta}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Full Resource Library */}
      {activeCategory === "All" ? (
        <section className="home-section">
          <div className="home-container">
            <Reveal>
              <p className="home-eyebrow">Resource Library</p>
              <h2 className="home-title">All guides, playbooks, and downloads.</h2>
            </Reveal>
            <div className="rs-featured rs-featured--library">
              {ALL_RESOURCES.map((item, i) => (
                <Reveal key={`lib-${item.id}`} delay={i * 0.02}>
                  <article className="rs-featured__card">
                    <MarketingCoverArt
                      variant={item.coverVariant}
                      gradient={item.gradient}
                      label={item.type}
                      className="rs-featured__cover"
                      size="md"
                    />
                    <div className="rs-featured__body">
                      <span className="rs-featured__meta">
                        {item.readTime} · {item.category}
                      </span>
                      <h3>{item.title}</h3>
                      <Link href={item.href} className="rs-featured__cta">
                        {item.cta}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Browse by Category */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Browse by Category</p>
            <h2 className="home-title">Find resources for your focus area.</h2>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="rs-categories" role="tablist" aria-label="Resource categories">
              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === "All"}
                className={cn("rs-categories__chip", activeCategory === "All" && "is-active")}
                onClick={() => setActiveCategory("All")}
              >
                All
              </button>
              {RESOURCE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === cat}
                  className={cn("rs-categories__chip", activeCategory === cat && "is-active")}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Free Downloads */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Free Downloads</p>
            <h2 className="home-title">Templates and checklists—ready to use.</h2>
            <p className="home-lead">
              Practical PDFs for operators evaluating or running on Busal OS.
            </p>
          </Reveal>
          <div className="rs-downloads">
            {FREE_DOWNLOADS.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.03}>
                <DownloadCard title={item.title} desc={item.desc} format={item.format} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Center */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Learning Center</p>
            <h2 className="home-title">Every format you need to learn Busal.</h2>
          </Reveal>
          <div className="rs-learning">
            {LEARNING_CENTER.map((item, i) => (
              <Reveal key={item.type} delay={i * 0.03}>
                <Link href={item.href} className="rs-learning__card">
                  <span className="rs-learning__count">{item.count}</span>
                  <strong>{item.type}</strong>
                  <span>{item.desc}</span>
                  <span className="rs-learning__link">
                    Explore
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Video */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Featured Video</p>
            <h2 className="home-title">See Busal OS in action.</h2>
          </Reveal>
          <Reveal delay={0.06}>
            <ResourcesVideoPreview />
          </Reveal>
        </div>
      </section>

      {/* Latest Insights */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Latest Insights</p>
            <h2 className="home-title">Fresh thinking for modern operators.</h2>
          </Reveal>
          <div className="rs-insights">
            {LATEST_INSIGHTS.map((item, i) => (
              <Reveal key={`${item.slug}-${i}`} delay={i * 0.03}>
                <article className="rs-insights__card">
                  <div className="rs-insights__meta">
                    <span className="rs-insights__category">{item.category}</span>
                    <span>{item.readTime}</span>
                    <span>{item.date}</span>
                  </div>
                  <h3>
                    <Link href={`${MARKETING_ROUTES.blog}/${item.slug}`}>{item.title}</Link>
                  </h3>
                  <p>{item.excerpt}</p>
                  <footer className="rs-insights__footer">
                    <span>{item.author}</span>
                    <Link
                      href={`${MARKETING_ROUTES.blog}/${item.slug}`}
                      className="rs-insights__cta"
                    >
                      Read article
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </footer>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}>
            <Link href={MARKETING_ROUTES.blog} className="rs-insights__all">
              View all articles
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Newsletter */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <div className="rs-newsletter">
              <div className="rs-newsletter__glow" aria-hidden="true" />
              <h2 className="rs-newsletter__title">Stay Ahead with AI Business Insights.</h2>
              <p className="rs-newsletter__lead">
                Weekly operator insights, product updates, and AI playbooks—no spam, unsubscribe
                anytime.
              </p>
              <div className="rs-newsletter__form">
                <NewsletterForm />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="rs-cta" aria-labelledby="rs-cta-title">
        <div className="home-container">
          <Reveal>
            <div className="rs-cta__panel">
              <div className="rs-cta__glow rs-cta__glow--a" aria-hidden="true" />
              <div className="rs-cta__glow rs-cta__glow--b" aria-hidden="true" />
              <p className="home-eyebrow" style={{ position: "relative" }}>
                Get started
              </p>
              <h2 id="rs-cta-title" className="rs-cta__title">
                Ready to apply what you&apos;ve learned?
              </h2>
              <div className="rs-cta__actions">
                <Link href={ROUTES.signup} className="home-btn home-btn--primary">
                  Start Free Trial
                </Link>
                <Link href={MARKETING_ROUTES.bookDemo} className="home-btn home-btn--secondary">
                  Book Demo
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
