"use client";

import { ArrowRight, Clock, Newspaper } from "lucide-react";
import Link from "next/link";

import { MarketingAuthorAvatar } from "@/modules/marketing/components/marketing-author-avatar";
import { MarketingCoverArt } from "@/modules/marketing/components/marketing-cover-art";
import { useMemo, useState } from "react";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { FadeIn, Reveal } from "@/modules/marketing/components/home/home-motion";
import { NewsletterForm } from "@/modules/marketing/components/newsletter-form";
import {
  BLOG_ARTICLES,
  BLOG_CATEGORIES,
  EDITORS_PICKS,
  FEATURED_STORY,
  PRODUCT_UPDATES,
  TRENDING_ARTICLES,
  type BlogArticle,
  type BlogCategory,
} from "@/modules/marketing/components/blog/blog-data";
import { BlogHeroViz } from "@/modules/marketing/components/blog/blog-visuals";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";

import "@/modules/marketing/components/home/home.css";
import "./blog.css";

function ArticleCard({
  article,
  variant = "grid",
}: {
  article: BlogArticle;
  variant?: "grid" | "editor";
}) {
  const href = `${MARKETING_ROUTES.blog}/${article.slug}`;

  return (
    <article className={cn("bl-article", variant === "editor" && "bl-article--editor")}>
      <Link href={href} className="bl-article__cover-link">
        <MarketingCoverArt
          variant={article.coverVariant}
          gradient={article.gradient}
          label={article.category}
          className="bl-article__cover"
          size="md"
        />
      </Link>
      <div className="bl-article__body">
        <div className="bl-article__tags">
          {article.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="bl-article__tag">
              {tag}
            </span>
          ))}
        </div>
        <div className="bl-article__meta">
          <span>{article.readTime}</span>
          <time dateTime={article.date}>{article.dateLabel}</time>
        </div>
        <h3>
          <Link href={href}>{article.title}</Link>
        </h3>
        <p>{article.excerpt}</p>
        <footer className="bl-article__footer">
          <span className="bl-article__author">
            <MarketingAuthorAvatar initials={article.authorInitials} name={article.author} />
            {article.author}
          </span>
          <Link href={href} className="bl-article__cta">
            Read Article
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </article>
  );
}

export function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<BlogCategory | "All">("All");

  const filteredArticles = useMemo(() => {
    if (activeCategory === "All") return BLOG_ARTICLES;
    return BLOG_ARTICLES.filter((a) => a.category === activeCategory);
  }, [activeCategory]);

  const scrollToArticles = () => {
    document
      .getElementById("latest-articles")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToNewsletter = () => {
    document
      .getElementById("blog-newsletter")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const featuredHref = `${MARKETING_ROUTES.blog}/${FEATURED_STORY.slug}`;

  return (
    <div className="bl">
      {/* Hero */}
      <section className="bl-hero">
        <div className="bl-hero__glow" />
        <div className="home-container">
          <div className="bl-hero__grid">
            <div>
              <FadeIn delay={0.04}>
                <span className="home-hero__badge">
                  <Newspaper className="h-3.5 w-3.5 text-[#8B5CF6]" aria-hidden="true" />
                  Blog
                </span>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 className="bl-hero__headline">
                  Insights for the Future of
                  <br />
                  <span className="bl-hero__accent">Business.</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.18}>
                <p className="home-hero__desc">
                  Discover practical strategies, AI trends, operational playbooks and product
                  updates to help your business grow smarter with Busal OS.
                </p>
              </FadeIn>
              <FadeIn delay={0.26}>
                <div className="home-hero__actions">
                  <button
                    type="button"
                    className="home-btn home-btn--primary"
                    onClick={scrollToArticles}
                  >
                    Browse Articles
                  </button>
                  <button
                    type="button"
                    className="home-btn home-btn--secondary"
                    onClick={scrollToNewsletter}
                  >
                    Subscribe
                  </button>
                </div>
              </FadeIn>
            </div>
            <FadeIn delay={0.2}>
              <BlogHeroViz />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Featured Story */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Featured Story</p>
          </Reveal>
          <Reveal delay={0.06}>
            <article className="bl-featured">
              <Link href={featuredHref} className="bl-featured__cover-link">
                <MarketingCoverArt
                  variant={FEATURED_STORY.coverVariant}
                  gradient={FEATURED_STORY.gradient}
                  label={FEATURED_STORY.category}
                  className="bl-featured__cover"
                  size="lg"
                />
              </Link>
              <div className="bl-featured__body">
                <div className="bl-featured__tags">
                  {FEATURED_STORY.tags.map((tag) => (
                    <span key={tag} className="bl-featured__tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="bl-featured__meta">
                  <span className="bl-featured__pill">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {FEATURED_STORY.readTime}
                  </span>
                  <time dateTime={FEATURED_STORY.date}>{FEATURED_STORY.dateLabel}</time>
                </div>
                <h2>
                  <Link href={featuredHref}>{FEATURED_STORY.title}</Link>
                </h2>
                <p>{FEATURED_STORY.excerpt}</p>
                <footer className="bl-featured__footer">
                  <span className="bl-featured__author">
                    <MarketingAuthorAvatar
                      initials={FEATURED_STORY.authorInitials}
                      name={FEATURED_STORY.author}
                      size="md"
                    />
                    {FEATURED_STORY.author}
                  </span>
                  <Link href={featuredHref} className="home-btn home-btn--primary">
                    Read featured story
                  </Link>
                </footer>
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      {/* Latest Articles */}
      <section className="home-section" id="latest-articles">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Latest Articles</p>
            <h2 className="home-title">Fresh thinking for modern operators.</h2>
          </Reveal>
          <div className="bl-grid">
            {BLOG_ARTICLES.map((article, i) => (
              <Reveal key={article.slug} delay={i * 0.04}>
                <ArticleCard article={article} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Browse Categories */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Browse Categories</p>
            <h2 className="home-title">Filter by topic.</h2>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="bl-categories" role="tablist" aria-label="Blog categories">
              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === "All"}
                className={cn("bl-categories__chip", activeCategory === "All" && "is-active")}
                onClick={() => setActiveCategory("All")}
              >
                All
              </button>
              {BLOG_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === cat}
                  className={cn("bl-categories__chip", activeCategory === cat && "is-active")}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Reveal>
          {filteredArticles.length > 0 ? (
            <div className="bl-grid bl-grid--filtered">
              {filteredArticles.map((article, i) => (
                <Reveal key={`${article.slug}-filter-${i}`} delay={i * 0.03}>
                  <ArticleCard article={article} />
                </Reveal>
              ))}
            </div>
          ) : (
            <p className="bl-empty">No articles in this category yet — subscribe for updates.</p>
          )}
        </div>
      </section>

      {/* Trending */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Trending Articles</p>
            <h2 className="home-title">What operators are reading now.</h2>
          </Reveal>
          <div className="bl-trending">
            {TRENDING_ARTICLES.map((article, i) => (
              <Reveal key={`trend-${article.slug}`} delay={i * 0.04}>
                <Link
                  href={`${MARKETING_ROUTES.blog}/${article.slug}`}
                  className="bl-trending__card-link"
                >
                  <MarketingCoverArt
                    variant={article.coverVariant}
                    gradient={article.gradient}
                    label={article.category}
                    className="bl-trending__card"
                    size="md"
                  />
                  <div className="bl-trending__overlay">
                    <strong>{article.title}</strong>
                    <span className="bl-trending__meta">
                      {article.readTime} · {article.author}
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Editor's Picks */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Editor&apos;s Picks</p>
            <h2 className="home-title">Curated by the Busal team.</h2>
          </Reveal>
          <div className="bl-editors">
            {EDITORS_PICKS.map((article, i) => (
              <Reveal key={`edit-${article.slug}`} delay={i * 0.04}>
                <ArticleCard article={article} variant="editor" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="home-section" id="blog-newsletter">
        <div className="home-container">
          <Reveal>
            <div className="bl-newsletter">
              <div className="bl-newsletter__glow" aria-hidden="true" />
              <h2 className="bl-newsletter__title">Get AI Business Insights Weekly.</h2>
              <p className="bl-newsletter__lead">
                Practical strategies, product updates, and operator playbooks—delivered every week.
              </p>
              <div className="bl-newsletter__form">
                <NewsletterForm />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Product Updates */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Product Updates</p>
            <h2 className="home-title">What we&apos;re shipping.</h2>
            <p className="home-lead">
              New features, releases, roadmap milestones, and AI improvements on Busal OS.
            </p>
          </Reveal>
          <div className="bl-updates">
            {PRODUCT_UPDATES.map((item, i) => (
              <Reveal key={`${item.title}-${i}`} delay={i * 0.04}>
                <Link href={item.href} className="bl-updates__item">
                  <span className="bl-updates__type">{item.type}</span>
                  <strong>{item.title}</strong>
                  <p>{item.desc}</p>
                  <time>{item.date}</time>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bl-cta" aria-labelledby="bl-cta-title">
        <div className="home-container">
          <Reveal>
            <div className="bl-cta__panel">
              <div className="bl-cta__glow bl-cta__glow--a" aria-hidden="true" />
              <div className="bl-cta__glow bl-cta__glow--b" aria-hidden="true" />
              <p className="home-eyebrow" style={{ position: "relative" }}>
                Next steps
              </p>
              <h2 id="bl-cta-title" className="bl-cta__title">
                Continue Your AI Journey.
              </h2>
              <div className="bl-cta__actions">
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
