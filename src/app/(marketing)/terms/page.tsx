import Link from "next/link";

import { ContentBlock, PageHero } from "@/modules/marketing/components/page-primitives";
import { MarketingSection } from "@/modules/marketing/components/marketing-typography";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { BRAND } from "@/modules/marketing/content/site-copy";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Terms & Conditions",
  description:
    "Busal OS Terms and Conditions: subscription terms, acceptable use, data ownership, and liability for the SaaS platform.",
  path: MARKETING_ROUTES.terms,
});

const LAST_UPDATED = "2 August 2026";

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms & Conditions"
        description={`Terms governing access to and use of ${BRAND.name}. Last updated: ${LAST_UPDATED}.`}
        breadcrumbs={[{ name: "Terms & Conditions", path: MARKETING_ROUTES.terms }]}
      />

      <MarketingSection className="pt-0 pb-24">
        <ContentBlock>
          <p className="text-marketing-muted text-sm">Last updated: {LAST_UPDATED}</p>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            1. Agreement
          </h2>
          <p className="text-marketing-muted">
            These Terms and Conditions (&ldquo;Terms&rdquo;) constitute a legally binding agreement
            between Busal Ltd (&ldquo;Busal&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) and the
            entity or individual (&ldquo;Customer&rdquo;, &ldquo;you&rdquo;) accessing or using the{" "}
            {BRAND.name} platform and related services (&ldquo;Services&rdquo;). By creating an
            account, executing an order form, or using the Services, you agree to these Terms.
          </p>
          <p className="text-marketing-muted">
            If you accept on behalf of an organisation, you represent that you have authority to
            bind that organisation. Enterprise customers may be subject to additional order forms or
            data processing agreements that prevail over conflicting provisions in these Terms.
          </p>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            2. Services
          </h2>
          <p className="text-marketing-muted">
            {BRAND.name} is a cloud-based software platform providing business operations, customer
            management, finance, AI assistance, and related modules as described on our website and
            in your subscription plan. We may update, modify, or discontinue features with
            reasonable notice where materially adverse to your use.
          </p>
          <p className="text-marketing-muted">
            Implementation, training, and onboarding services, where purchased, are governed by the
            scope defined in your order form or statement of work.
          </p>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            3. Accounts and access
          </h2>
          <p className="text-marketing-muted">
            You are responsible for maintaining the confidentiality of account credentials and for
            all activity under your account. You must provide accurate registration information and
            promptly update it. You must configure roles and permissions appropriately for your
            staff and ensure compliance with applicable employment and data protection laws when
            granting access.
          </p>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            4. Subscription and fees
          </h2>
          <p className="text-marketing-muted">
            Subscription fees are billed monthly or as otherwise agreed in your order form, in GBP
            unless stated otherwise. One-time implementation fees are due as specified at purchase.
            Fees are exclusive of VAT and applicable taxes, which you are responsible for where
            required.
          </p>
          <p className="text-marketing-muted">
            Unless otherwise agreed, subscriptions renew automatically at the end of each billing
            period. You may cancel in accordance with your plan terms; cancellation takes effect at
            the end of the current billing period. We may suspend access for overdue payments after
            reasonable notice.
          </p>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            5. Acceptable use
          </h2>
          <p className="text-marketing-muted">You agree not to:</p>
          <ul className="text-marketing-muted list-disc space-y-2 pl-5">
            <li>Use the Services for unlawful purposes or in violation of third-party rights.</li>
            <li>Attempt to gain unauthorised access to systems, accounts, or data.</li>
            <li>
              Reverse engineer, decompile, or extract source code except where permitted by law.
            </li>
            <li>
              Introduce malware, interfere with platform performance, or abuse API rate limits.
            </li>
            <li>
              Resell or sublicense the Services except as expressly permitted in a partner
              agreement.
            </li>
            <li>
              Use the Services to store or transmit content that is illegal, harmful, or infringes
              intellectual property.
            </li>
          </ul>
          <p className="text-marketing-muted">
            We may suspend or terminate access for material breach of acceptable use, with notice
            where practicable.
          </p>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            6. Customer data
          </h2>
          <p className="text-marketing-muted">
            You retain ownership of data you input into the Services (&ldquo;Customer Data&rdquo;).
            You grant Busal a limited licence to host, process, and display Customer Data solely to
            provide and improve the Services, including AI-assisted features operating within your
            permission model.
          </p>
          <p className="text-marketing-muted">
            You are responsible for the accuracy, legality, and appropriateness of Customer Data.
            Our processing of personal data is described in our{" "}
            <Link
              href={MARKETING_ROUTES.privacy}
              className="text-marketing-accent font-medium hover:underline"
            >
              Privacy Policy
            </Link>{" "}
            and, where applicable, a Data Processing Agreement.
          </p>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            7. Intellectual property
          </h2>
          <p className="text-marketing-muted">
            Busal and its licensors retain all rights in the platform, software, documentation,
            branding, and underlying technology. These Terms do not grant you any rights to our
            intellectual property except the limited right to use the Services during your
            subscription.
          </p>
          <p className="text-marketing-muted">
            Feedback you provide may be used by Busal to improve the Services without obligation or
            compensation.
          </p>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            8. Confidentiality
          </h2>
          <p className="text-marketing-muted">
            Each party agrees to protect the other&apos;s confidential information with reasonable
            care and to use it only for purposes related to the Services. Confidentiality
            obligations survive termination except for information that becomes public through no
            fault of the receiving party.
          </p>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            9. Warranties and disclaimers
          </h2>
          <p className="text-marketing-muted">
            We warrant that the Services will perform substantially in accordance with applicable
            documentation during your subscription. Except as expressly stated, the Services are
            provided &ldquo;as is&rdquo; and we disclaim all implied warranties including
            merchantability, fitness for a particular purpose, and non-infringement to the fullest
            extent permitted by law.
          </p>
          <p className="text-marketing-muted">
            AI-generated outputs are assistive and require human review. You are responsible for
            decisions made based on platform outputs.
          </p>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            10. Limitation of liability
          </h2>
          <p className="text-marketing-muted">
            To the maximum extent permitted by applicable law, neither party shall be liable for
            indirect, incidental, special, consequential, or punitive damages, or for loss of
            profits, revenue, data, or goodwill.
          </p>
          <p className="text-marketing-muted">
            Busal&apos;s aggregate liability arising from or related to these Terms shall not exceed
            the fees paid by you to Busal in the twelve (12) months preceding the claim. Nothing in
            these Terms limits liability for death or personal injury caused by negligence, fraud,
            or any liability that cannot be limited by law.
          </p>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            11. Term and termination
          </h2>
          <p className="text-marketing-muted">
            These Terms remain in effect for the duration of your subscription. Either party may
            terminate for material breach if not cured within thirty (30) days of written notice.
            Upon termination, your access ceases and we will make Customer Data available for export
            for a reasonable period, after which it may be deleted in accordance with our retention
            policies.
          </p>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            12. Governing law
          </h2>
          <p className="text-marketing-muted">
            These Terms are governed by the laws of England and Wales. The courts of England and
            Wales shall have exclusive jurisdiction, without prejudice to mandatory consumer
            protections where applicable.
          </p>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            13. General
          </h2>
          <p className="text-marketing-muted">
            We may assign these Terms in connection with a merger, acquisition, or sale of assets.
            You may not assign without our prior written consent. If any provision is unenforceable,
            the remainder remains in effect. Failure to enforce a provision is not a waiver. Notices
            to Busal should be sent to{" "}
            <a href="mailto:legal@getbusal.com" className="text-marketing-accent font-medium">
              legal@getbusal.com
            </a>
            .
          </p>

          <p className="text-marketing-muted border-marketing-line border-t pt-8 text-sm">
            Questions about these Terms?{" "}
            <Link
              href={MARKETING_ROUTES.contact}
              className="text-marketing-accent font-medium hover:underline"
            >
              Contact us
            </Link>{" "}
            or email{" "}
            <a href="mailto:legal@getbusal.com" className="text-marketing-accent font-medium">
              legal@getbusal.com
            </a>
            .
          </p>
        </ContentBlock>
      </MarketingSection>
    </>
  );
}
