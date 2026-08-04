"use client";

import dynamic from "next/dynamic";
import { Bot, CalendarDays, Package, ShoppingCart, Sparkles, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { ActivityTimeline } from "@/modules/dashboard/components/activity-timeline";
import { DashboardCard } from "@/modules/dashboard/components/dashboard-card";
import { DashboardGrid, DashboardGridItem } from "@/modules/dashboard/components/dashboard-grid";
import { useDashboardContext } from "@/modules/dashboard/components/dashboard-provider";
import { NotificationCard } from "@/modules/dashboard/components/notification-card";
import { QuickActionCard } from "@/modules/dashboard/components/quick-action-card";
import { SectionHeader } from "@/modules/dashboard/components/section-header";
import { StatCard } from "@/modules/dashboard/components/stat-card";
import { WidgetContainer } from "@/modules/dashboard/components/widget-container";
import {
  DASHBOARD_PINNED_MODULES,
  DASHBOARD_QUICK_ACTIONS,
} from "@/modules/dashboard/constants/navigation";
import { filterByFeatureFlag, filterByPermission } from "@/modules/dashboard/lib/filter-navigation";
import { resolveBusinessName, resolveDisplayName } from "@/modules/dashboard/lib/dashboard-display";
import type { DashboardHomeData } from "@/modules/dashboard/types/dashboard";
import type { BusinessProfileData } from "@/types/business-profile";
import { NOTIFICATIONS_ROUTES } from "@/modules/notifications/constants/routes";
import { hasPermission } from "@/modules/authorization/utils/permission-utils";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";

const LazyAiInsights = dynamic(
  () =>
    import("@/modules/dashboard/components/widgets/ai-insights-widget").then(
      (module) => module.AiInsightsWidget,
    ),
  {
    loading: () => (
      <WidgetContainer id="ai-insights" title="AI Insights" loading>
        {null}
      </WidgetContainer>
    ),
  },
);

interface DashboardHomeProps {
  business: BusinessProfileData;
  userFullName: string;
  homeData: DashboardHomeData;
}

function formatCurrency(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export function DashboardHome({ business, userFullName, homeData }: DashboardHomeProps) {
  const { permissions, featureFlags } = useDashboardContext();
  const ownerName = resolveDisplayName(business.ownerName, userFullName);
  const businessName = resolveBusinessName(business.businessName);

  const quickActions = useMemo(
    () =>
      filterByFeatureFlag(filterByPermission(DASHBOARD_QUICK_ACTIONS, permissions), featureFlags),
    [featureFlags, permissions],
  );

  const canViewAnalytics = hasPermission(permissions, PERMISSION_CODES.ANALYTICS_VIEW);
  const canViewOrders = hasPermission(permissions, PERMISSION_CODES.ORDER_VIEW);
  const canViewReservations = hasPermission(permissions, PERMISSION_CODES.RESERVATION_VIEW);
  const canViewCustomers = hasPermission(permissions, PERMISSION_CODES.CRM_VIEW);
  const canViewStaff = hasPermission(permissions, PERMISSION_CODES.STAFF_VIEW);
  const canViewInventory = hasPermission(permissions, PERMISSION_CODES.INVENTORY_VIEW);
  const canViewNotifications = hasPermission(permissions, PERMISSION_CODES.NOTIFICATIONS_VIEW);
  const canViewTasks = hasPermission(permissions, PERMISSION_CODES.SUCCESS_VIEW);

  return (
    <div className="flex flex-col gap-8">
      <DashboardCard
        title={`Welcome back, ${ownerName}`}
        description={`Busal is ready to help you run ${businessName}.`}
      >
        <p className="text-muted-foreground text-sm">
          Your production dashboard foundation is active across desktop, tablet, and mobile layouts.
        </p>
      </DashboardCard>

      <DashboardGrid>
        <DashboardGridItem span={2}>
          <WidgetContainer id="business-overview" title="Business Overview">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-xs uppercase">Business</p>
                <p className="text-lg font-semibold">{homeData.stats.businessName}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Branch context</p>
                <p className="text-lg font-semibold">{businessName}</p>
              </div>
            </div>
          </WidgetContainer>
        </DashboardGridItem>

        {canViewAnalytics ? (
          <DashboardGridItem>
            <StatCard
              title="Today's Revenue"
              value={formatCurrency(homeData.stats.todayRevenuePence)}
              icon={Wallet}
            />
          </DashboardGridItem>
        ) : null}

        {canViewOrders ? (
          <DashboardGridItem>
            <StatCard title="Orders" value={homeData.stats.todayOrders} icon={ShoppingCart} />
          </DashboardGridItem>
        ) : null}

        {canViewReservations ? (
          <DashboardGridItem>
            <StatCard
              title="Reservations"
              value={homeData.stats.todayReservations}
              icon={CalendarDays}
            />
          </DashboardGridItem>
        ) : null}

        {canViewCustomers ? (
          <DashboardGridItem>
            <StatCard title="Customers" value={homeData.stats.totalCustomers} icon={Users} />
          </DashboardGridItem>
        ) : null}

        {canViewStaff ? (
          <DashboardGridItem>
            <StatCard title="Staff Online" value={homeData.stats.staffOnline} icon={Users} />
          </DashboardGridItem>
        ) : null}

        {canViewInventory ? (
          <DashboardGridItem>
            <StatCard
              title="Inventory Alerts"
              value={homeData.stats.inventoryAlerts}
              icon={Package}
              description="Low stock and out-of-stock items"
            />
          </DashboardGridItem>
        ) : null}
      </DashboardGrid>

      <section className="space-y-4">
        <SectionHeader
          title="Quick Actions"
          description="Launch common workflows without leaving the dashboard."
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.id}
              label={action.label}
              href={action.href}
              icon={action.icon}
            />
          ))}
        </div>
      </section>

      <DashboardGrid>
        <DashboardGridItem span={2}>
          <WidgetContainer id="recent-activity" title="Recent Activity">
            <ActivityTimeline items={homeData.recentActivity} />
          </WidgetContainer>
        </DashboardGridItem>

        <DashboardGridItem span={2}>
          <WidgetContainer
            id="pinned-modules"
            title="Pinned Modules"
            description="Fast access to your most-used modules."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {DASHBOARD_PINNED_MODULES.map((module) => {
                const Icon = module.icon;
                return (
                  <Button
                    key={module.id}
                    asChild
                    variant="outline"
                    className="h-auto justify-start py-3"
                  >
                    <Link href={module.href}>
                      <Icon className="h-4 w-4" />
                      {module.label}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </WidgetContainer>
        </DashboardGridItem>

        <DashboardGridItem span={2}>
          <LazyAiInsights />
        </DashboardGridItem>

        {canViewNotifications ? (
          <DashboardGridItem span={2}>
            <WidgetContainer
              id="recent-notifications"
              title="Recent Notifications"
              action={
                <Button asChild variant="link" size="sm" className="px-0">
                  <Link href={NOTIFICATIONS_ROUTES.inbox}>View all</Link>
                </Button>
              }
            >
              <div className="space-y-3">
                {homeData.recentNotifications.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No notifications yet.</p>
                ) : (
                  homeData.recentNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      {...notification}
                      href={NOTIFICATIONS_ROUTES.inbox}
                    />
                  ))
                )}
              </div>
            </WidgetContainer>
          </DashboardGridItem>
        ) : null}

        {canViewTasks ? (
          <DashboardGridItem span={2}>
            <WidgetContainer id="upcoming-tasks" title="Upcoming Tasks">
              {homeData.upcomingTasks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No open tasks.</p>
              ) : (
                <ul className="space-y-3">
                  {homeData.upcomingTasks.map((task) => (
                    <li key={task.id} className="rounded-md border p-3">
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {task.dueDate ? new Date(task.dueDate).toLocaleString() : "No due date"} ·{" "}
                        {task.status}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </WidgetContainer>
          </DashboardGridItem>
        ) : null}
      </DashboardGrid>

      <DashboardCard
        title="AI Daily Brief"
        description="Good morning!"
        action={<Sparkles className="text-primary h-5 w-5" aria-hidden="true" />}
      >
        <div className="flex items-start gap-3">
          <Bot className="text-primary mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-2">
            <p className="text-sm">
              {canViewAnalytics
                ? `Today you have ${homeData.stats.todayOrders} orders and ${formatCurrency(homeData.stats.todayRevenuePence)} in revenue.`
                : "Your AI insights will appear here as modules generate operational data."}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/ai-knowledge">Open AI workspace</Link>
            </Button>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}
