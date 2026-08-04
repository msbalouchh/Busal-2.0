import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { ApiGatewayNav } from "@/modules/api-gateway/components/api-gateway-nav";

export const metadata: Metadata = {
  title: "API Gateway & Integration",
};

export default function ApiGatewayLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Secure, route, monitor, and manage API traffic across Busal OS."
      nav={<ApiGatewayNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
