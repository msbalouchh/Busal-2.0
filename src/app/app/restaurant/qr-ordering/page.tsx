import type { Metadata } from "next";
import { QrCode } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { QrOrderingDashboardPanel } from "@/modules/qr-ordering-management/components/qr-ordering-dashboard-panel";
import { getQrOrderingDashboardContext } from "@/modules/qr-ordering-management/lib/get-qr-ordering-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface QrOrderingPageProps {
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "QR Ordering" };
}

export default async function QrOrderingPage({ searchParams }: QrOrderingPageProps) {
  const params = await searchParams;
  const context = await getQrOrderingDashboardContext(params.branchId ?? "");

  return (
    <ApplicationPageTemplate
      title="QR Ordering"
      description="Generate table QR codes and enable customer mobile ordering."
      icon={QrCode}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "QR Ordering" },
      ]}
    >
      <QrOrderingDashboardPanel
        context={context}
        qrCodes={context.qrCodes}
        tables={context.tables}
        stats={context.stats}
      />
    </ApplicationPageTemplate>
  );
}
