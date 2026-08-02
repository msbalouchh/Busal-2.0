"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Briefcase,
  ChevronDown,
  Clock,
  Headphones,
  Mail,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";
import {
  CONTACT_FAQ,
  CONTACT_HOURS,
  CONTACT_OPTIONS,
} from "@/modules/marketing/components/contact/contact-data";
import { ContactFormPanel } from "@/modules/marketing/components/contact/contact-form-panel";
import {
  ContactHeroViz,
  ContactWorldMap,
} from "@/modules/marketing/components/contact/contact-visuals";
import { FadeIn, Reveal } from "@/modules/marketing/components/home/home-motion";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";

import "@/modules/marketing/components/home/home.css";
import "./contact.css";

const OPTION_ICONS = [TrendingUp, Users, Headphones, Briefcase, Mail] as const;

function FaqItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const reduced = useReducedMotion();

  return (
    <div className={cn("ct-faq__item", open && "is-open")}>
      <button
        type="button"
        className="ct-faq__trigger"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="ct-faq__question">{q}</span>
        <span className="ct-faq__chevron" aria-hidden="true">
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
            <p className="ct-faq__answer">{a}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function ContactPage() {
  const scrollToForm = () => {
    document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="ct">
      {/* Hero */}
      <section className="ct-hero">
        <div className="ct-hero__glow" />
        <div className="home-container">
          <div className="ct-hero__grid">
            <div>
              <FadeIn delay={0.04}>
                <span className="home-hero__badge">
                  <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" aria-hidden="true" />
                  Contact
                </span>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 className="ct-hero__headline">
                  Let&apos;s Build the Future of
                  <br />
                  <span className="ct-hero__accent">Your Business.</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.18}>
                <p className="home-hero__desc">
                  Whether you need a demo, technical guidance, partnership opportunities or
                  enterprise support, the Busal team is here to help.
                </p>
              </FadeIn>
            </div>
            <FadeIn delay={0.2}>
              <ContactHeroViz />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Get in touch</p>
            <h2 className="home-title">Send us a message.</h2>
            <p className="home-lead">
              Complete the form and our team will route your enquiry to the right specialist.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <ContactFormPanel />
          </Reveal>
        </div>
      </section>

      {/* Contact Options */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Contact Options</p>
            <h2 className="home-title">Reach the right team directly.</h2>
          </Reveal>
          <div className="ct-options">
            {CONTACT_OPTIONS.map((item, i) => {
              const Icon = OPTION_ICONS[i] ?? Mail;
              return (
                <Reveal key={item.title} delay={i * 0.03}>
                  <a href={item.href} className="ct-options__card">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <strong>{item.title}</strong>
                    <span className="ct-options__email">{item.email}</span>
                    <span className="ct-options__desc">{item.desc}</span>
                    <span className="ct-options__response">{item.response}</span>
                  </a>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Global Presence */}
      <section className="home-section home-section--tight">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Global Presence</p>
            <h2 className="home-title">Serving businesses worldwide.</h2>
            <p className="home-lead">
              Headquartered in London with cloud infrastructure and expansion across key global
              markets.
            </p>
          </Reveal>
          <div className="ct-global">
            <Reveal delay={0.06}>
              <ContactWorldMap />
            </Reveal>
            <Reveal delay={0.1}>
              <div className="ct-global__copy">
                <p>
                  Busal operates from the United Kingdom with customers across Europe today—and
                  active expansion into the Middle East, North America, and Asia Pacific.
                </p>
                <p>
                  Our cloud platform delivers low-latency access globally, with regional data
                  residency options for enterprise customers.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Office Hours */}
      <section className="home-section">
        <div className="home-container">
          <Reveal>
            <p className="home-eyebrow">Office Hours</p>
            <h2 className="home-title">When we&apos;re available.</h2>
          </Reveal>
          <div className="ct-hours">
            {CONTACT_HOURS.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.04}>
                <article className="ct-hours__card">
                  <Clock className="h-5 w-5" aria-hidden="true" />
                  <strong>{item.title}</strong>
                  <span className="ct-hours__detail">{item.detail}</span>
                  <span className="ct-hours__note">{item.note}</span>
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
            <h2 className="home-title">Common contact questions.</h2>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="ct-faq">
              {CONTACT_FAQ.map((item, i) => (
                <FaqItem key={item.q} q={item.q} a={item.a} defaultOpen={i === 0} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="ct-cta" aria-labelledby="ct-cta-title">
        <div className="home-container">
          <Reveal>
            <div className="ct-cta__panel">
              <div className="ct-cta__glow ct-cta__glow--a" aria-hidden="true" />
              <div className="ct-cta__glow ct-cta__glow--b" aria-hidden="true" />
              <p className="home-eyebrow" style={{ position: "relative" }}>
                Next steps
              </p>
              <h2 id="ct-cta-title" className="ct-cta__title">
                Need help choosing the right solution?
              </h2>
              <div className="ct-cta__actions">
                <Link href={MARKETING_ROUTES.bookDemo} className="home-btn home-btn--primary">
                  Book Demo
                </Link>
                <button
                  type="button"
                  className="home-btn home-btn--secondary"
                  onClick={scrollToForm}
                >
                  Talk to Sales
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
