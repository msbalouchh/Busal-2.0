import { DemoBookingFlow } from "@/modules/marketing/components/demo-booking-flow";
import { MarketingCtaBand } from "@/modules/marketing/components/marketing-cta";
import { PageHero } from "@/modules/marketing/components/page-primitives";
import {
  MarketingEyebrow,
  MarketingHeading,
  MarketingLead,
  MarketingSection,
} from "@/modules/marketing/components/marketing-typography";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { JOURNEY } from "@/modules/marketing/content/site-copy";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "Book a Demo",
  description:
    "Book a Busal OS demo: walk through POS, CRM, kitchen, AI, and multi-branch workflows with a platform specialist.",
  path: MARKETING_ROUTES.bookDemo,
});

export default function BookDemoPage() {
  return (
    <>
      <PageHero
        eyebrow="Book a demo"
        title="See Busal OS in your context."
        description="Tell us about your business, choose a time, and we'll schedule a tailored walkthrough—orders, kitchen, CRM, AI, and the modules that matter to you."
        secondaryHref={MARKETING_ROUTES.contact}
        secondaryLabel="Contact sales instead"
        breadcrumbs={[{ name: "Book a Demo", path: MARKETING_ROUTES.bookDemo }]}
      />

      <MarketingSection className="pt-0">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div>
            <DemoBookingFlow />
          </div>

          <div>
            <MarketingEyebrow>What to expect</MarketingEyebrow>
            <MarketingHeading as="h3">A focused session, not a slide deck.</MarketingHeading>
            <MarketingLead>
              Demos typically run 30–45 minutes. We&apos;ll cover your service flow, answer
              technical and commercial questions, and outline next steps if Busal is a fit.
            </MarketingLead>

            <div className="border-marketing-line bg-marketing-panel mt-8 rounded-3xl border px-6 py-8">
              <p className="text-marketing-ink text-sm font-semibold">Live scheduling</p>
              <p className="text-marketing-muted mt-2 text-sm leading-relaxed">
                Pick a preferred business-day slot in the booking flow. A Busal specialist confirms
                by email with a calendar invite—usually within one business day.
              </p>
            </div>

            <ol className="mt-8 space-y-4">
              {JOURNEY.slice(0, 4).map((stage) => (
                <li key={stage.step} className="flex gap-4">
                  <span className="text-marketing-accent font-semibold">{stage.step}</span>
                  <div>
                    <p className="text-marketing-ink text-sm font-semibold">{stage.title}</p>
                    <p className="text-marketing-muted text-xs">{stage.summary}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection className="pb-24">
        <MarketingCtaBand
          title="Questions before booking?"
          description="Contact sales at sales@getbusal.com or use our contact form—we're happy to help."
        />
      </MarketingSection>
    </>
  );
}
