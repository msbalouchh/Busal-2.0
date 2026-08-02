"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, LifeBuoy, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Reveal } from "@/modules/marketing/components/home/home-motion";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { FAQ_ITEMS } from "@/modules/marketing/content/site-copy";

function FaqAccordionItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const reduced = useReducedMotion();

  return (
    <div className={cn("home-faq__item", open && "is-open")}>
      <button
        type="button"
        className="home-faq__trigger"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="home-faq__question">{q}</span>
        <span className="home-faq__chevron" aria-hidden="true">
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
            <p className="home-faq__answer">{a}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function HomeFaqSection() {
  return (
    <section className="home-section home-faq" aria-labelledby="home-faq-title">
      <div className="home-container">
        <div className="home-faq__grid">
          <Reveal className="home-faq__aside">
            <p className="home-eyebrow">FAQ</p>
            <h2 id="home-faq-title" className="home-title">
              Answers before the first call.
            </h2>
            <p className="home-lead">
              Everything operators ask during evaluation—from implementation scope to how AI uses
              your data.
            </p>

            <div className="home-faq__support">
              <div className="home-faq__support-icon" aria-hidden="true">
                <LifeBuoy className="h-6 w-6" />
              </div>
              <h3 className="home-faq__support-title">Need a human answer?</h3>
              <p className="home-faq__support-text">
                Our team helps with demos, implementation planning, and account-specific questions.
              </p>
              <div className="home-faq__support-actions">
                <Link href={MARKETING_ROUTES.contact} className="home-btn home-btn--primary">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Contact support
                </Link>
                <Link href={MARKETING_ROUTES.help} className="home-btn home-btn--secondary">
                  Visit Help Center
                </Link>
              </div>
              <a href="mailto:support@getbusal.com" className="home-faq__support-email">
                <Mail className="h-4 w-4" aria-hidden="true" />
                support@getbusal.com
              </a>
            </div>
          </Reveal>

          <Reveal className="home-faq__accordion" delay={0.08}>
            {FAQ_ITEMS.map((item, index) => (
              <FaqAccordionItem key={item.q} q={item.q} a={item.a} index={index} />
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
