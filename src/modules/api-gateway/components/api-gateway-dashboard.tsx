import type { ApiGatewayDashboardView } from "@/modules/api-gateway/utils/api-gateway-utils";

interface ApiGatewayDashboardProps {
  dashboard: ApiGatewayDashboardView;
}

export function ApiGatewayDashboard({ dashboard }: ApiGatewayDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Total Routes</p>
        <p className="text-2xl font-semibold">{dashboard.totalRoutes}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Active Routes</p>
        <p className="text-2xl font-semibold">{dashboard.activeRoutes}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Registered Endpoints</p>
        <p className="text-2xl font-semibold">{dashboard.registeredEndpoints}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Total Requests</p>
        <p className="text-2xl font-semibold">{dashboard.totalRequests}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Recent Requests (7d)</p>
        <p className="text-2xl font-semibold">{dashboard.recentRequests}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Success Rate</p>
        <p className="text-2xl font-semibold">{dashboard.successRate.toFixed(1)}%</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Avg Response Time</p>
        <p className="text-2xl font-semibold">{dashboard.avgResponseTimeMs}ms</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Rate Limit Events</p>
        <p className="text-2xl font-semibold">{dashboard.rateLimitEvents}</p>
      </div>
    </div>
  );
}
