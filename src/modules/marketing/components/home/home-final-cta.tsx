"use client";

import Link from "next/link";

import { ROUTES } from "@/constants/routes";
import { Reveal } from "@/modules/marketing/components/home/home-motion";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";

export function HomeFinalCta() {
  return (
    <section className="home-final-cta" aria-labelledby="home-final-cta-title">
      <div className="home-container">
        <Reveal>
          <div className="home-final-cta__panel">
            <div className="home-final-cta__glow home-final-cta__glow--blue" aria-hidden="true" />
            <div className="home-final-cta__glow home-final-cta__glow--violet" aria-hidden="true" />
            <div className="home-final-cta__glow home-final-cta__glow--center" aria-hidden="true" />
            <div className="home-final-cta__grid" aria-hidden="true" />

            <div className="home-final-cta__content">
              <p className="home-final-cta__eyebrow">Get started with Busal OS</p>
              <h2 id="home-final-cta-title" className="home-final-cta__title">
                Ready to run your business with AI?
              </h2>
              <p className="home-final-cta__lead">
                Join operators who replaced fragmented tools with one AI-first operating system.
                Book a guided demo—or start free and configure your first location today.
              </p>
              <div className="home-final-cta__actions">
                <Link href={MARKETING_ROUTES.bookDemo} className="home-btn home-btn--primary">
                  Book Demo
                </Link>
                <Link href={ROUTES.signup} className="home-btn home-btn--secondary">
                  Start Free
                </Link>
              </div>
              <p className="home-final-cta__note">
                Enterprise onboarding · Multi-branch ready · Dedicated success team
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
