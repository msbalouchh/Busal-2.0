"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, Calendar, ChevronDown, Cloud, Shield, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { BookDemoBooking } from "@/modules/marketing/components/book-demo/book-demo-booking";
import {
  DEMO_BENEFITS,
  DEMO_FAQ,
  DEMO_TRUST,
} from "@/modules/marketing/components/book-demo/book-demo-data";
import {
  BookDemoHeroViz,
  BookDemoTimeline,
} from "@/modules/marketing/components/book-demo/book-demo-visuals";
import { FadeIn, Reveal } from "@/modules/marketing/components/home/home-motion";

import "@/modules/marketing/components/home/home.css";
import "./book-demo.css";

const TRUST_ICONS = [Shield, BadgeCheck, Cloud, Zap, Sparkles] as const;

function FaqItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const reduced = useReducedMotion();

  return (
    <div className={cn("bd-faq__item", open && "is-open")}>
      <button
        type="button"
        className="bd-faq__trigger"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="bd-faq__question">{q}</span>
        <span className="bd-faq__chevron" aria-hidden="true">
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
            <p className="bd-faq__answer">{a}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function BookDemoPage() {
  const scrollToBooking = () => {
    document
      .getElementById("book-demo-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bd">
      {/* Hero */}
      <section className="bd-hero">
        <div className="bd-hero__glow" />
        <div className="home-container">
          <div className="bd-hero__grid">
            <div>
              <FadeIn delay={0.04}>
                <span className="home-hero__badge">
                  <Calendar className="h-3.5 w-3.5 text-[#8B5CF6]" aria-hidden="true" />
                  Book a Demo
                </span>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 className="bd-hero__headline">
                  See Busal OS
                  <br />
                  <span className="bd-hero__accent">In Action.</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.18}>
                <p className="home-hero__desc">
                  Book a personalized 30-minute product demonstration with a Busal specialist and
                  discover how AI can transform your business operations.
                </p>
              </FadeIn>
              <FadeIn delay={0.26}>
                <div className="home-hero__actions">
                  <button
                    type="button"
                    className="home-btn home-btn--primary"
                    onClick={scrollToBooking}
                  >
                    Book Your Demo
                  </button>
                </div>
              </FadeIn>
            </div>
            <FadeIn delay={0.2}>
              <BookDemoHeroViz />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Booking wizard (Calendar + Business + Interests) */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Schedule</p>
            <h2 className="home-title">Book your personalized demo.</h2>
            <p className="home-lead">
              Select a date and time, tell us about your business, and choose what you&apos;d like
              to explore—we&apos;ll tailor the session to you.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <BookDemoBooking />
          </Reveal>
        </div>
      </section>

      {/* What Happens Next */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">What Happens Next?</p>
            <h2 className="home-title">From booking to go-live.</h2>
            <p className="home-lead">
              A structured journey—not a sales pitch. Here&apos;s what to expect after you book.
            </p>
          </Reveal>
          <BookDemoTimeline />
        </div>
      </section>

      {/* Why Book A Demo */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Why Book A Demo?</p>
            <h2 className="home-title">More than a product tour.</h2>
          </Reveal>
          <div className="bd-benefits">
            {DEMO_BENEFITS.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.03}>
                <article className="bd-benefits__card">
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Trusted By Growing Businesses</p>
            <h2 className="home-title">Enterprise foundations you can rely on.</h2>
          </Reveal>
          <div className="bd-trust">
            {DEMO_TRUST.map((item, i) => {
              const Icon = TRUST_ICONS[i] ?? Shield;
              return (
                <Reveal key={item.title} delay={i * 0.03}>
                  <article className="bd-trust__card">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <strong>{item.title}</strong>
                    <span>{item.desc}</span>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">FAQ</p>
            <h2 className="home-title">Common questions before booking.</h2>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="bd-faq">
              {DEMO_FAQ.map((item, i) => (
                <FaqItem key={item.q} q={item.q} a={item.a} defaultOpen={i === 0} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bd-cta" aria-labelledby="bd-cta-title">
        <div className="home-container">
          <Reveal>
            <div className="bd-cta__panel">
              <div className="bd-cta__glow bd-cta__glow--a" aria-hidden="true" />
              <div className="bd-cta__glow bd-cta__glow--b" aria-hidden="true" />
              <p className="home-eyebrow" style={{ position: "relative" }}>
                Get started
              </p>
              <h2 id="bd-cta-title" className="bd-cta__title">
                Ready to modernize your business?
              </h2>
              <p className="bd-cta__lead">Book Your Demo Today.</p>
              <div className="bd-cta__actions">
                <button
                  type="button"
                  className="home-btn home-btn--primary"
                  onClick={scrollToBooking}
                >
                  Book Demo
                </button>
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
