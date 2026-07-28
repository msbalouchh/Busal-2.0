import type { Metadata } from "next";

import { ApiGatewayNav } from "@/modules/api-gateway/components/api-gateway-nav";

export const metadata: Metadata = {
  title: "API Gateway & Integration",
};

export default function ApiGatewayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          API Gateway & Integration Platform
        </h1>
        <p className="text-muted-foreground text-sm">
          Centralized gateway securing, routing, monitoring, and managing all external and internal
          API traffic across Busal OS.
        </p>
      </div>
      <ApiGatewayNav />
      {children}
    </div>
  );
}
