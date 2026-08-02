import Link from "next/link";

import { ContentBlock, PageHero } from "@/modules/marketing/components/page-primitives";
import { MarketingSection } from "@/modules/marketing/components/marketing-typography";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { BRAND } from "@/modules/marketing/content/site-copy";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Privacy Policy",
  description:
    "Busal OS Privacy Policy: how we collect, use, store, and protect personal data for customers and website visitors in the United Kingdom.",
  path: MARKETING_ROUTES.privacy,
});

const LAST_UPDATED = "2 August 2026";

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        description={`How ${BRAND.name} collects, uses, and protects personal data. Last updated: ${LAST_UPDATED}.`}
        breadcrumbs={[{ name: "Privacy Policy", path: MARKETING_ROUTES.privacy }]}
      />

      <MarketingSection className="pt-0 pb-24">
        <ContentBlock>
          <p className="text-marketing-muted text-sm">Last updated: {LAST_UPDATED}</p>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            1. Introduction
          </h2>
          <p className="text-marketing-muted">
            Busal Ltd (&ldquo;Busal&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or
            &ldquo;our&rdquo;) operates the {BRAND.name} platform and website at {BRAND.domain}.
            This Privacy Policy explains how we process personal data when you visit our website,
            request a demo, create an account, or use our services.
          </p>
          <p className="text-marketing-muted">
            We are the data controller for personal data described in this policy. For questions,
            contact{" "}
            <a href="mailto:privacy@getbusal.com" className="text-marketing-accent font-medium">
              privacy@getbusal.com
            </a>
            .
          </p>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            2. Data we collect
          </h2>
          <p className="text-marketing-muted">
            We may collect the following categories of personal data:
          </p>
          <ul className="text-marketing-muted list-disc space-y-2 pl-5">
            <li>
              <strong className="text-marketing-ink">Identity and contact data</strong> — name,
              email address, phone number, job title, and business name.
            </li>
            <li>
              <strong className="text-marketing-ink">Account and usage data</strong> — login
              credentials, role assignments, activity logs, and configuration preferences within the
              platform.
            </li>
            <li>
              <strong className="text-marketing-ink">Business operational data</strong> — orders,
              customer records, inventory, financial transactions, and other data you or your
              organisation input into {BRAND.name}.
            </li>
            <li>
              <strong className="text-marketing-ink">Technical data</strong> — IP address, browser
              type, device identifiers, and analytics cookies when you use our website or platform.
            </li>
            <li>
              <strong className="text-marketing-ink">Communications</strong> — messages you send via
              contact forms, support tickets, or email correspondence.
            </li>
          </ul>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            3. How we use your data
          </h2>
          <p className="text-marketing-muted">
            We process personal data for the following purposes:
          </p>
          <ul className="text-marketing-muted list-disc space-y-2 pl-5">
            <li>
              Providing, maintaining, and improving the {BRAND.name} platform and related services.
            </li>
            <li>Processing demo requests, sales enquiries, and customer support.</li>
            <li>Authenticating users and enforcing role-based access controls.</li>
            <li>
              Generating analytics, reports, and AI-assisted recommendations within your business
              context.
            </li>
            <li>Complying with legal obligations and protecting the security of our systems.</li>
            <li>
              Sending service-related communications; marketing communications where you have opted
              in.
            </li>
          </ul>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            4. Legal bases (UK GDPR)
          </h2>
          <p className="text-marketing-muted">
            We rely on the following legal bases under UK GDPR:
          </p>
          <ul className="text-marketing-muted list-disc space-y-2 pl-5">
            <li>
              <strong className="text-marketing-ink">Contract</strong> — to perform our agreement
              with you or your organisation.
            </li>
            <li>
              <strong className="text-marketing-ink">Legitimate interests</strong> — to operate,
              secure, and improve our services, provided your rights are not overridden.
            </li>
            <li>
              <strong className="text-marketing-ink">Consent</strong> — where required for marketing
              or non-essential cookies.
            </li>
            <li>
              <strong className="text-marketing-ink">Legal obligation</strong> — where processing is
              required by law.
            </li>
          </ul>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            5. Data sharing
          </h2>
          <p className="text-marketing-muted">
            We do not sell personal data. We may share data with subprocessors who assist in
            hosting, payments, email delivery, analytics, and customer support—each bound by data
            processing agreements. We may disclose data where required by law or to protect our
            rights and the security of users.
          </p>
          <p className="text-marketing-muted">
            Your organisation&apos;s operational data is tenant-scoped. We do not use one
            customer&apos;s business data to train models accessible to other customers without
            explicit agreement.
          </p>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            6. International transfers
          </h2>
          <p className="text-marketing-muted">
            Where personal data is transferred outside the United Kingdom, we implement appropriate
            safeguards such as UK International Data Transfer Agreements or equivalent mechanisms
            approved under UK GDPR.
          </p>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            7. Retention
          </h2>
          <p className="text-marketing-muted">
            We retain personal data for as long as necessary to provide services, fulfil contractual
            obligations, and comply with legal requirements. Account data is typically retained for
            the duration of your subscription plus a reasonable period thereafter. You may request
            deletion subject to legal and contractual constraints.
          </p>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            8. Security
          </h2>
          <p className="text-marketing-muted">
            We implement technical and organisational measures including encryption in transit
            (HTTPS), tenant isolation, role-based access controls, audit logging, and regular
            security reviews. No method of transmission or storage is completely secure; we
            encourage strong passwords and appropriate internal access policies.
          </p>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            9. Your rights
          </h2>
          <p className="text-marketing-muted">
            Under UK GDPR, you may have the right to access, rectify, erase, restrict, or object to
            processing of your personal data, and to data portability where applicable. You may
            withdraw consent at any time where processing is consent-based. To exercise your rights,
            contact{" "}
            <a href="mailto:privacy@getbusal.com" className="text-marketing-accent font-medium">
              privacy@getbusal.com
            </a>
            .
          </p>
          <p className="text-marketing-muted">
            You also have the right to lodge a complaint with the Information Commissioner&apos;s
            Office (ICO) at{" "}
            <a
              href="https://ico.org.uk"
              className="text-marketing-accent font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              ico.org.uk
            </a>
            .
          </p>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            10. Cookies
          </h2>
          <p className="text-marketing-muted">
            Our website uses essential cookies for authentication and security, and may use
            analytics cookies to understand usage. You can manage cookie preferences through your
            browser settings. Non-essential cookies require consent where applicable.
          </p>

          <h2 className="font-marketing-display text-marketing-ink text-xl tracking-tight sm:text-2xl">
            11. Changes
          </h2>
          <p className="text-marketing-muted">
            We may update this Privacy Policy from time to time. Material changes will be
            communicated via the website or email where appropriate. Continued use of our services
            after changes constitutes acceptance of the updated policy.
          </p>

          <p className="text-marketing-muted border-marketing-line border-t pt-8 text-sm">
            Questions about this policy?{" "}
            <Link
              href={MARKETING_ROUTES.contact}
              className="text-marketing-accent font-medium hover:underline"
            >
              Contact us
            </Link>{" "}
            or email{" "}
            <a href="mailto:privacy@getbusal.com" className="text-marketing-accent font-medium">
              privacy@getbusal.com
            </a>
            .
          </p>
        </ContentBlock>
      </MarketingSection>
    </>
  );
}
