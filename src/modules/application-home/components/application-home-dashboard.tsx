"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  CalendarDays,
  Package,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { Grid } from "@/components/common/grid";
import { PageContainer } from "@/components/common/page-container";
import { Section } from "@/components/common/section";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { Breadcrumb } from "@/components/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { DashboardActivityFeed } from "@/modules/application-home/components/dashboard-activity-feed";
import { DashboardAiPanel } from "@/modules/application-home/components/dashboard-ai-panel";
import { DashboardChartPreview } from "@/modules/application-home/components/dashboard-chart-preview";
import { DashboardHero } from "@/modules/application-home/components/dashboard-hero";
import { NOTIFICATIONS_ROUTES } from "@/modules/notifications/constants/routes";
import { QuickActionCard } from "@/modules/dashboard/components/quick-action-card";
import { StatCard } from "@/modules/dashboard/components/stat-card";
import type { ApplicationHomeData } from "@/modules/application-home/types/application-home-types";

const QUICK_ACTION_ICONS: Record<string, LucideIcon> = {
  "create-order": ShoppingCart,
  "add-customer": UserPlus,
  "manage-staff": Users,
  "open-ai": Bot,
  "view-reports": BarChart3,
  settings: Sparkles,
};

const SHORTCUT_ICONS: Record<string, LucideIcon> = {
  restaurant: ShoppingCart,
  reservations: CalendarDays,
  inventory: Package,
  integrations: Sparkles,
};

const SECTION_CLASS = "scroll-mt-20";

function formatCurrencyPence(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

interface ApplicationHomeDashboardProps {
  data: ApplicationHomeData;
}

export function ApplicationHomeDashboard({ data }: ApplicationHomeDashboardProps) {
  const { hero, homeData, businessHealthScore } = data;
  const stats = homeData.stats;

  const kpiCards = [
    {
      id: "revenue",
      title: "Today's Revenue",
      value: formatCurrencyPence(stats.todayRevenuePence),
      description: "Completed order revenue",
      trend: `${stats.todayOrders} orders today`,
      icon: Wallet,
    },
    {
      id: "orders",
      title: "Today's Orders",
      value: String(stats.todayOrders),
      description: "Across all channels",
      trend: `${stats.todayReservations} reservations`,
      icon: ShoppingCart,
    },
    {
      id: "customers",
      title: "Customers",
      value: stats.totalCustomers.toLocaleString("en-GB"),
      description: "Active customer profiles",
      trend: `${stats.staffOnline} staff active`,
      icon: Users,
    },
    {
      id: "alerts",
      title: "Inventory Alerts",
      value: String(stats.inventoryAlerts),
      description: "Low stock and out-of-stock",
      trend:
        stats.unreadNotifications > 0
          ? `${stats.unreadNotifications} unread notifications`
          : "Inbox up to date",
      icon: Package,
    },
  ];

  return (
    <PageContainer className="mx-auto w-full max-w-7xl gap-10">
      <div className={motion.fadeInUp}>
        <Breadcrumb
          items={[
            { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
            { label: "Dashboard" },
          ]}
        />
      </div>

      <div className={cn(motion.fadeInUp, "motion-safe:[animation-delay:50ms]")}>
        <DashboardHero hero={hero} healthScore={businessHealthScore} />
      </div>

      <Section
        title="Key metrics"
        description="Live performance indicators for your workspace."
        className={cn(SECTION_CLASS, motion.fadeInUp, "motion-safe:[animation-delay:100ms]")}
      >
        <Grid columns={2} className="gap-4 lg:grid-cols-4">
          {kpiCards.map((metric) => (
            <StatCard
              key={metric.id}
              title={metric.title}
              value={
                <div className="space-y-2.5">
                  <span className="text-3xl font-semibold tracking-tight">{metric.value}</span>
                  <Badge variant="secondary" className="gap-1 font-normal">
                    <TrendingUp className="h-3 w-3" aria-hidden="true" />
                    {metric.trend}
                  </Badge>
                </div>
              }
              description={metric.description}
              icon={metric.icon}
              className={cn("rounded-xl shadow-sm", "border-border/60", motion.cardInteractive)}
            />
          ))}
        </Grid>
      </Section>

      <Section
        title="Quick actions"
        description="Launch common workflows from your dashboard."
        className={cn(SECTION_CLASS, motion.fadeInUp, "motion-safe:[animation-delay:150ms]")}
      >
        <Grid columns="auto-fit" className="grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-4">
          {data.quickActions.map((action) => {
            const Icon = QUICK_ACTION_ICONS[action.id] ?? Sparkles;

            return (
              <Card
                key={action.id}
                className={cn("group rounded-xl shadow-sm", motion.cardInteractive)}
              >
                <CardHeader className="space-y-3 pb-3">
                  <div
                    className={cn(
                      "bg-muted flex h-10 w-10 items-center justify-center rounded-lg",
                      "motion-safe:transition-colors motion-safe:duration-200",
                      "group-hover:bg-primary/10",
                    )}
                  >
                    <Icon className="text-foreground h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-base tracking-tight">{action.label}</CardTitle>
                    <CardDescription className="leading-relaxed">
                      {action.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className={cn("w-full", motion.buttonPress)}
                  >
                    <Link href={action.href}>Open</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Grid>
      </Section>

      <Section
        title="Analytics"
        description="Weekly trends across revenue, orders, and customer growth."
        className={cn(SECTION_CLASS, motion.fadeInUp, "motion-safe:[animation-delay:200ms]")}
      >
        <Grid columns={2} className="gap-4">
          <DashboardChartPreview
            title="Revenue Trend"
            description="Daily revenue over the last 7 days"
            data={data.revenueTrend}
            valueKey="amount"
            summaryLabel="7-day revenue"
            formatSummary={(total, peak) =>
              `£${total.toLocaleString("en-GB")} total · Peak ${peak.day}`
            }
          />
          <DashboardChartPreview
            title="Orders Overview"
            description="Order volume over the last 7 days"
            data={data.ordersTrend}
            valueKey="count"
            summaryLabel="7-day orders"
            formatSummary={(total, peak) =>
              `${total.toLocaleString("en-GB")} orders · Peak ${peak.day}`
            }
          />
          <DashboardChartPreview
            title="Customer Growth"
            description="New customers added this week"
            data={data.customerGrowth}
            valueKey="count"
            summaryLabel="New customers"
            formatSummary={(total, peak) =>
              `${total.toLocaleString("en-GB")} new · Peak ${peak.day}`
            }
          />
          <Card className={cn("rounded-xl shadow-sm", motion.cardHover)}>
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-base font-semibold tracking-tight">
                Top Selling Products
              </CardTitle>
              <CardDescription>Best performers this week</CardDescription>
            </CardHeader>
            <CardContent>
              {data.topProducts.length === 0 ? (
                <p className="text-muted-foreground text-sm" role="status">
                  No product sales recorded this week yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {data.topProducts.map((product) => (
                    <li
                      key={product.name}
                      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm"
                    >
                      <span className="font-medium">{product.name}</span>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {product.quantitySold} sold · {formatCurrencyPence(product.revenuePence)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Section>

      <div
        className={cn(
          "grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]",
          SECTION_CLASS,
          motion.fadeInUp,
          "motion-safe:[animation-delay:250ms]",
        )}
      >
        <DashboardActivityFeed
          items={homeData.recentActivity}
          viewAllHref={APPLICATION_SHELL_ROUTES.restaurant}
        />
        <DashboardAiPanel insights={data.aiInsights} summary={data.aiSummary} />
      </div>

      <div
        className={cn(
          "grid gap-6 lg:grid-cols-2 xl:grid-cols-3",
          SECTION_CLASS,
          motion.fadeInUp,
          "motion-safe:[animation-delay:300ms]",
        )}
      >
        <Card className={cn("rounded-xl shadow-sm", motion.cardHover)}>
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s Schedule</CardTitle>
            <CardDescription>Upcoming reservations for today</CardDescription>
          </CardHeader>
          <CardContent>
            {data.todaySchedule.length === 0 ? (
              <p className="text-muted-foreground text-sm" role="status">
                No reservations scheduled for today.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.todaySchedule.map((item) => (
                  <li key={item.id}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="hover:bg-muted/50 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm motion-safe:transition-colors"
                      >
                        <span className="font-medium">{item.title}</span>
                        <time className="text-muted-foreground text-xs">{item.time}</time>
                      </Link>
                    ) : (
                      <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm">
                        <span className="font-medium">{item.title}</span>
                        <time className="text-muted-foreground text-xs">{item.time}</time>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className={cn("rounded-xl shadow-sm", motion.cardHover)}>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Notifications</CardTitle>
              <CardDescription>Recent inbox activity</CardDescription>
            </div>
            <Button asChild variant="link" size="sm" className="px-0">
              <Link href={NOTIFICATIONS_ROUTES.inbox}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {homeData.recentNotifications.length === 0 ? (
              <p className="text-muted-foreground text-sm" role="status">
                No notifications yet.
              </p>
            ) : (
              homeData.recentNotifications.map((notification) => (
                <div key={notification.id} className="rounded-lg border px-3 py-2.5">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-muted-foreground text-xs">{notification.body}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className={cn("rounded-xl shadow-sm", motion.cardHover)}>
          <CardHeader>
            <CardTitle className="text-base">Open Tasks</CardTitle>
            <CardDescription>Customer success follow-ups</CardDescription>
          </CardHeader>
          <CardContent>
            {homeData.upcomingTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm" role="status">
                No open tasks.
              </p>
            ) : (
              <ul className="space-y-2">
                {homeData.upcomingTasks.map((task) => (
                  <li key={task.id} className="rounded-lg border px-3 py-2.5 text-sm">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleString("en-GB")
                        : "No due date"}{" "}
                      · {task.status}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Section
        title="Favorite shortcuts"
        description="Pinned modules for fast navigation."
        className={cn(SECTION_CLASS, motion.fadeInUp, "motion-safe:[animation-delay:350ms]")}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.favoriteShortcuts.map((shortcut) => {
            const Icon = SHORTCUT_ICONS[shortcut.id] ?? Sparkles;
            return (
              <QuickActionCard
                key={shortcut.id}
                label={shortcut.label}
                description={shortcut.description}
                href={shortcut.href}
                icon={Icon}
              />
            );
          })}
        </div>
      </Section>

      <Section
        title="Business health"
        description="Operational readiness score based on today's activity."
        className={cn(SECTION_CLASS, motion.fadeInUp, "motion-safe:[animation-delay:400ms]")}
      >
        <Card className={cn("rounded-xl shadow-sm", motion.cardHover)}>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-semibold tracking-tight">{businessHealthScore}%</p>
                <p className="text-muted-foreground text-sm">Business health score</p>
              </div>
              <Badge variant={businessHealthScore >= 80 ? "default" : "secondary"}>
                {businessHealthScore >= 80 ? "Healthy" : "Needs attention"}
              </Badge>
            </div>
            <div
              className="bg-muted overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={businessHealthScore}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Business health score"
            >
              <div
                className="bg-primary h-2.5 rounded-full motion-safe:transition-all motion-safe:duration-500"
                style={{ width: `${businessHealthScore}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </Section>
    </PageContainer>
  );
}
