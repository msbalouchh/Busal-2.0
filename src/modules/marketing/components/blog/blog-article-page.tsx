import { ArrowLeft, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";
import { siteConfig } from "@/config/site";
import type { BlogArticleSection } from "@/modules/marketing/components/blog/blog-article-bodies";
import {
  getAdjacentBlogArticles,
  getRelatedBlogArticles,
  type BlogArticle,
} from "@/modules/marketing/components/blog/blog-data";
import { MarketingAuthorAvatar } from "@/modules/marketing/components/marketing-author-avatar";
import { MarketingBreadcrumbs } from "@/modules/marketing/components/marketing-breadcrumbs";
import { MarketingCoverArt } from "@/modules/marketing/components/marketing-cover-art";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";

import "./blog.css";
import "./blog-article.css";

type BlogArticlePageProps = {
  article: BlogArticle;
  sections: BlogArticleSection[];
};

function authorBio(name: string, category: string) {
  return `${name} writes about ${category.toLowerCase()}, operations, and practical AI for service businesses on the Busal OS blog.`;
}

function shareUrl(slug: string) {
  return `${siteConfig.url}${MARKETING_ROUTES.blog}/${slug}`;
}

export function BlogArticlePage({ article, sections }: BlogArticlePageProps) {
  const { prev, next } = getAdjacentBlogArticles(article.slug);
  const related = getRelatedBlogArticles(article.slug, 3);
  const url = shareUrl(article.slug);
  const shareText = encodeURIComponent(article.title);
  const shareHref = encodeURIComponent(url);

  return (
    <article className="bl-article-page">
      <MarketingBreadcrumbs
        items={[
          { name: "Blog", path: MARKETING_ROUTES.blog },
          { name: article.title, path: `${MARKETING_ROUTES.blog}/${article.slug}` },
        ]}
      />

      <header className="bl-article-page__hero">
        <div className="bl-article-page__hero-glow" aria-hidden="true" />
        <div className="home-container">
          <div className="bl-article-page__hero-inner">
            <Link href={MARKETING_ROUTES.blog} className="bl-article-page__back">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to blog
            </Link>

            <div className="bl-article-page__meta">
              <span className="bl-article-page__category">{article.category}</span>
              <span className="bl-article-page__meta-divider" aria-hidden="true">
                ·
              </span>
              <span>{article.readTime}</span>
              <span className="bl-article-page__meta-divider" aria-hidden="true">
                ·
              </span>
              <time dateTime={article.date}>{article.dateLabel}</time>
            </div>

            <h1 className="bl-article-page__title">{article.title}</h1>
            <p className="bl-article-page__subtitle">{article.excerpt}</p>

            <div className="bl-article-page__author-row">
              <span className="bl-article-page__author">
                <MarketingAuthorAvatar
                  initials={article.authorInitials}
                  name={article.author}
                  size="md"
                />
                {article.author}
              </span>
            </div>

            {article.tags.length > 0 ? (
              <div className="bl-article-page__tags">
                {article.tags.map((tag) => (
                  <span key={tag} className="bl-article-page__tag">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="bl-article-page__cover">
              <MarketingCoverArt
                variant={article.coverVariant}
                gradient={article.gradient}
                label={article.category}
                size="lg"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="bl-article-page__body">
        <div className="home-container">
          <div className="bl-article-page__prose">
            {sections.map((section, index) => (
              <section
                key={section.heading ?? `${section.paragraphs[0]?.slice(0, 48)}-${index}`}
                className="bl-article-page__section"
              >
                {section.heading ? <h2>{section.heading}</h2> : null}
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </div>

      <footer className="bl-article-page__bottom">
        <div className="home-container">
          <div className="bl-article-page__bottom-inner">
            <div className="bl-article-page__author-card">
              <MarketingAuthorAvatar
                initials={article.authorInitials}
                name={article.author}
                size="md"
              />
              <div>
                <p className="bl-article-page__author-card-name">{article.author}</p>
                <p className="bl-article-page__author-card-role">{article.category} · Busal OS</p>
                <p className="bl-article-page__author-card-bio">
                  {authorBio(article.author, article.category)}
                </p>
              </div>
            </div>

            <div className="bl-article-page__share">
              <p className="bl-article-page__share-label">Share this article</p>
              <div className="bl-article-page__share-actions">
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareHref}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bl-article-page__share-btn"
                >
                  <Linkedin className="h-4 w-4" aria-hidden="true" />
                  LinkedIn
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${shareHref}&text=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bl-article-page__share-btn"
                >
                  <Twitter className="h-4 w-4" aria-hidden="true" />X
                </a>
              </div>
            </div>

            <nav className="bl-article-page__nav" aria-label="Article navigation">
              {prev ? (
                <Link
                  href={`${MARKETING_ROUTES.blog}/${prev.slug}`}
                  className="bl-article-page__nav-link"
                >
                  <span className="bl-article-page__nav-label">Previous</span>
                  <span className="bl-article-page__nav-title">{prev.title}</span>
                </Link>
              ) : (
                <span
                  className="bl-article-page__nav-link bl-article-page__nav-link--placeholder"
                  aria-hidden="true"
                />
              )}
              {next ? (
                <Link
                  href={`${MARKETING_ROUTES.blog}/${next.slug}`}
                  className="bl-article-page__nav-link bl-article-page__nav-link--next"
                >
                  <span className="bl-article-page__nav-label">Next</span>
                  <span className="bl-article-page__nav-title">{next.title}</span>
                </Link>
              ) : (
                <span
                  className="bl-article-page__nav-link bl-article-page__nav-link--next bl-article-page__nav-link--placeholder"
                  aria-hidden="true"
                />
              )}
            </nav>

            {related.length > 0 ? (
              <section className="bl-article-page__related" aria-labelledby="related-articles">
                <div className="bl-article-page__related-header">
                  <p className="bl-article-page__related-eyebrow">Keep reading</p>
                  <h2 id="related-articles" className="bl-article-page__related-title">
                    Related articles
                  </h2>
                </div>
                <div className="bl-article-page__related-grid">
                  {related.map((item) => (
                    <Link
                      key={item.slug}
                      href={`${MARKETING_ROUTES.blog}/${item.slug}`}
                      className="bl-article-page__related-card"
                    >
                      <MarketingCoverArt
                        variant={item.coverVariant}
                        gradient={item.gradient}
                        label={item.category}
                        size="sm"
                      />
                      <div className="bl-article-page__related-card-body">
                        <span className="bl-article-page__related-card-meta">
                          {item.readTime} · {item.dateLabel}
                        </span>
                        <p className="bl-article-page__related-card-title">{item.title}</p>
                        <p className="bl-article-page__related-card-excerpt">{item.excerpt}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="bl-article-page__cta" aria-labelledby="article-cta-title">
              <div className="bl-article-page__cta-panel">
                <div className="bl-article-page__cta-glow" aria-hidden="true" />
                <h2 id="article-cta-title" className="bl-article-page__cta-title">
                  Ready to transform your business with Busal OS?
                </h2>
                <p className="bl-article-page__cta-lead">
                  Book a demo to see how Busal OS unifies operations, customers, finance, and AI in
                  one platform built for modern service businesses.
                </p>
                <div className="bl-article-page__cta-actions">
                  <Link href={MARKETING_ROUTES.bookDemo} className="home-btn home-btn--primary">
                    Book Demo
                  </Link>
                  <Link href={ROUTES.signup} className="home-btn home-btn--secondary">
                    Start Free Trial
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </footer>
    </article>
  );
}
