import { Fraunces, Manrope } from "next/font/google";

import { MarketingShell } from "@/modules/marketing/components/marketing-shell";
import { organizationJsonLd, softwareApplicationJsonLd } from "@/modules/marketing/lib/seo";

const marketingDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-marketing-display",
  display: "swap",
  preload: true,
});

const marketingSans = Manrope({
  subsets: ["latin"],
  variable: "--font-marketing-sans",
  display: "swap",
  preload: true,
});

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${marketingDisplay.variable} ${marketingSans.variable}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationJsonLd(), softwareApplicationJsonLd()]),
        }}
      />
      <MarketingShell>{children}</MarketingShell>
    </div>
  );
}
