import { ContactForm } from "@/modules/marketing/components/contact-form";
import { MarketingCtaBand } from "@/modules/marketing/components/marketing-cta";
import { OfficeMap } from "@/modules/marketing/components/office-map";
import { PageHero } from "@/modules/marketing/components/page-primitives";
import {
  MarketingEyebrow,
  MarketingHeading,
  MarketingSection,
} from "@/modules/marketing/components/marketing-typography";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { CONTACT_OFFICE } from "@/modules/marketing/content/site-copy";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Contact",
  description:
    "Contact Busal OS: sales, support, partnerships, and general enquiries. We're here to help growing businesses run on one platform.",
  path: MARKETING_ROUTES.contact,
});

const CONTACT_CARDS = [
  {
    label: "Sales",
    value: "sales@getbusal.com",
    href: "mailto:sales@getbusal.com",
    note: "Demos, pricing, and enterprise enquiries",
    detail: "Response within one business day",
  },
  {
    label: "Support",
    value: "support@getbusal.com",
    href: "mailto:support@getbusal.com",
    note: "Existing customers and account issues",
    detail: "Mon–Fri, priority for live sites",
  },
  {
    label: "Phone",
    value: "+44 20 7946 0958",
    href: "tel:+442079460958",
    note: "Sales & success desk",
    detail: "Mon–Fri, 9:00–17:30 GMT",
  },
] as const;

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to the Busal team."
        description="Sales, support, partnerships, or press—we respond to every message. Use the form or reach us directly."
        primaryHref={MARKETING_ROUTES.bookDemo}
        primaryLabel="Book a demo"
        breadcrumbs={[{ name: "Contact", path: MARKETING_ROUTES.contact }]}
      />

      <MarketingSection className="pt-0">
        <div className="grid gap-4 sm:grid-cols-3">
          {CONTACT_CARDS.map((channel) => (
            <article
              key={channel.label}
              className="border-marketing-line bg-marketing-panel rounded-3xl border px-5 py-6"
            >
              <p className="text-marketing-muted text-xs font-semibold tracking-wide uppercase">
                {channel.label}
              </p>
              <a
                href={channel.href}
                className="text-marketing-ink mt-2 block text-lg font-semibold hover:underline"
              >
                {channel.value}
              </a>
              <p className="text-marketing-muted mt-2 text-sm">{channel.note}</p>
              <p className="text-marketing-accent mt-3 text-xs font-medium">{channel.detail}</p>
            </article>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <MarketingEyebrow>Visit</MarketingEyebrow>
            <MarketingHeading as="h3">London office</MarketingHeading>
            <div className="border-marketing-line mt-6 rounded-3xl border p-6">
              <p className="text-marketing-ink text-sm font-medium">{CONTACT_OFFICE.company}</p>
              <address className="text-marketing-muted mt-2 text-sm leading-relaxed not-italic">
                {CONTACT_OFFICE.lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </div>
            <div className="mt-6">
              <OfficeMap />
            </div>
          </div>

          <div>
            <MarketingEyebrow>Message</MarketingEyebrow>
            <MarketingHeading as="h3">Send an enquiry</MarketingHeading>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection className="pb-24">
        <MarketingCtaBand
          title="Prefer a live walkthrough?"
          description="Book a demo and we'll show Busal OS in the context of your operation."
        />
      </MarketingSection>
    </>
  );
}
