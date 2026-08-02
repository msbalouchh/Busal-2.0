import { MarketingCtaBand } from "@/modules/marketing/components/marketing-cta";
import { AiPreview } from "@/modules/marketing/components/product-previews";
import { PageHero } from "@/modules/marketing/components/page-primitives";
import {
  MarketingEyebrow,
  MarketingHeading,
  MarketingLead,
  MarketingSection,
} from "@/modules/marketing/components/marketing-typography";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { AI_AGENTS, AI_ROADMAP } from "@/modules/marketing/content/site-copy";
import { marketingMetadata } from "@/modules/marketing/lib/seo";

export const metadata = marketingMetadata({
  title: "AI Platform",
  description:
    "Busal AI agents for sales, marketing, finance, HR, support, operations, and executive briefings—grounded in your live business data.",
  path: MARKETING_ROUTES.ai,
});

export default function AiPlatformPage() {
  return (
    <>
      <PageHero
        eyebrow="AI Platform"
        title="AI that works inside your business—not beside it."
        description="Busal’s AI agents operate on real orders, customers, inventory, and workflows. Recommendations arrive with context your teams already trust."
        primaryHref={MARKETING_ROUTES.bookDemo}
        secondaryHref={MARKETING_ROUTES.pricing}
        secondaryLabel="View plans"
        breadcrumbs={[{ name: "AI Platform", path: MARKETING_ROUTES.ai }]}
      />

      <MarketingSection className="pt-0">
        <AiPreview />
      </MarketingSection>

      <MarketingSection>
        <MarketingEyebrow>Domain agents</MarketingEyebrow>
        <MarketingHeading>Every function gets a specialist.</MarketingHeading>
        <MarketingLead>
          From AI CEO briefings to kitchen-aware operations support, each agent is designed for a
          job—not a generic chat window.
        </MarketingLead>
        <div className="mt-12 space-y-0">
          {AI_AGENTS.map((agent, index) => (
            <article
              key={agent.name}
              className="border-marketing-line grid gap-4 border-t py-8 sm:grid-cols-[8rem_1fr] lg:grid-cols-[10rem_1fr_1.2fr]"
            >
              <p className="text-marketing-accent font-marketing-display text-2xl tracking-tight">
                {String(index + 1).padStart(2, "0")}
              </p>
              <div>
                <h3 className="text-marketing-ink text-xl font-semibold tracking-tight">
                  {agent.name}
                </h3>
                <p className="text-marketing-muted mt-2 text-sm leading-relaxed sm:text-base">
                  {agent.summary}
                </p>
              </div>
              <div className="border-marketing-line bg-marketing-panel hidden rounded-2xl border px-5 py-4 lg:block">
                <p className="text-marketing-muted text-xs font-semibold tracking-wide uppercase">
                  Business intelligence
                </p>
                <p className="text-marketing-ink mt-2 text-sm leading-relaxed">
                  Reads live operational signals within your tenant boundaries and returns
                  recommendations your managers can act on during the day.
                </p>
              </div>
            </article>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection>
        <MarketingEyebrow>Intelligence layer</MarketingEyebrow>
        <MarketingHeading>Business intelligence with operating context.</MarketingHeading>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "Live operational truth",
              summary:
                "Agents reason over orders, inventory, customers, and finance—not detached spreadsheets.",
            },
            {
              title: "Permission-aware",
              summary:
                "Insights respect roles and tenant isolation so sensitive data never leaks across businesses.",
            },
            {
              title: "Actionable narratives",
              summary:
                "Dashboards stay visual; agents add the story: what changed, why it matters, what to do next.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="border-marketing-line bg-marketing-panel rounded-3xl border px-6 py-8"
            >
              <h3 className="text-marketing-ink text-base font-semibold">{item.title}</h3>
              <p className="text-marketing-muted mt-3 text-sm leading-relaxed">{item.summary}</p>
            </div>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection>
        <MarketingEyebrow>Roadmap</MarketingEyebrow>
        <MarketingHeading>Future vision with discipline.</MarketingHeading>
        <MarketingLead>
          Voice agents, deeper orchestration, and industry-specific copilots continue to
          expand—always behind permission boundaries and tenant isolation.
        </MarketingLead>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2">
          {AI_ROADMAP.map((item) => (
            <li
              key={item.phase}
              className="border-marketing-line bg-marketing-surface rounded-3xl border px-6 py-7"
            >
              <p className="text-marketing-accent text-xs font-semibold tracking-[0.16em] uppercase">
                {item.phase}
              </p>
              <h3 className="text-marketing-ink mt-2 text-lg font-semibold">{item.title}</h3>
              <p className="text-marketing-muted mt-2 text-sm leading-relaxed">{item.summary}</p>
            </li>
          ))}
        </ol>
      </MarketingSection>

      <MarketingSection className="pb-24">
        <MarketingCtaBand
          title="Put AI to work on your morning brief."
          description="Book a demo to see AI agents using live operational signals from Busal OS."
        />
      </MarketingSection>
    </>
  );
}
