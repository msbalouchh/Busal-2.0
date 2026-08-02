import Link from "next/link";

import { AI_PLATFORM_ROUTES } from "@/modules/ai-platform/constants/ai-platform";
import type {
  AiDashboardWidgets,
  AiPlatformActivityItem,
  AiPlatformPermissions,
  AiRecentConversation,
} from "@/modules/ai-platform/types/ai-platform-types";

interface AiPlatformOverviewProps {
  widgets: AiDashboardWidgets;
  permissions: AiPlatformPermissions;
  recentConversations: AiRecentConversation[];
  recentActivity: AiPlatformActivityItem[];
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

export function AiPlatformOverview({
  widgets,
  permissions,
  recentConversations,
  recentActivity,
}: AiPlatformOverviewProps) {
  const cards = [
    {
      label: "Published agents",
      value: widgets.publishedAgents.toString(),
      href: AI_PLATFORM_ROUTES.agents,
      visible: permissions.canViewAgents,
    },
    {
      label: "Knowledge documents",
      value: widgets.knowledgeDocuments.toString(),
      href: AI_PLATFORM_ROUTES.knowledge,
      visible: permissions.canViewKnowledge,
    },
    {
      label: "Active automations",
      value: widgets.activeAutomations.toString(),
      href: AI_PLATFORM_ROUTES.automation,
      visible: permissions.canViewAutomation,
    },
    {
      label: "Registered tools",
      value: widgets.registeredTools.toString(),
      href: AI_PLATFORM_ROUTES.tools,
      visible: permissions.canViewTools,
    },
    {
      label: "Tokens used",
      value: widgets.totalTokensUsed.toLocaleString(),
      href: AI_PLATFORM_ROUTES.analytics,
      visible: permissions.canViewAnalytics,
    },
    {
      label: "Automation success",
      value: formatPercent(widgets.automationSuccessRate),
      href: AI_PLATFORM_ROUTES.automation,
      visible: permissions.canViewAutomation,
    },
    {
      label: "AI health",
      value: formatPercent(widgets.healthScore),
      href: AI_PLATFORM_ROUTES.analytics,
      visible: permissions.canViewAnalytics,
    },
    {
      label: "Pending approvals",
      value: widgets.pendingApprovals.toString(),
      href: AI_PLATFORM_ROUTES.automation,
      visible: permissions.canViewAutomation,
    },
  ].filter((card) => card.visible);

  const quickActions = [
    {
      label: "Open assistant",
      href: AI_PLATFORM_ROUTES.assistant,
      visible: permissions.canUseChat,
    },
    {
      label: "Create agent",
      href: AI_PLATFORM_ROUTES.agentsModule,
      visible: permissions.canManageAgents,
    },
    {
      label: "Upload knowledge",
      href: AI_PLATFORM_ROUTES.knowledgeModule,
      visible: permissions.canManageKnowledge,
    },
    {
      label: "View tools",
      href: AI_PLATFORM_ROUTES.tools,
      visible: permissions.canViewTools,
    },
  ].filter((action) => action.visible);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="hover:bg-muted/40 rounded-lg border p-4 transition-colors"
          >
            <p className="text-muted-foreground text-sm">{card.label}</p>
            <p className="text-2xl font-semibold">{card.value}</p>
          </Link>
        ))}
      </div>

      {quickActions.length > 0 ? (
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Quick actions</h2>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {permissions.canUseChat ? (
        <div className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Recent conversations</h2>
            <Link
              href={AI_PLATFORM_ROUTES.assistant}
              className="text-primary text-sm hover:underline"
            >
              Open assistant
            </Link>
          </div>
          {recentConversations.length === 0 ? (
            <p className="text-muted-foreground text-sm">No assistant queries yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentConversations.map((conversation) => (
                <li key={conversation.id}>
                  <span className="font-medium">{conversation.query}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {conversation.resultCount} results
                    {conversation.confidenceScore != null
                      ? ` · ${formatPercent(conversation.confidenceScore)} confidence`
                      : ""}{" "}
                    · {new Date(conversation.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {recentActivity.length > 0 ? (
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">AI activity</h2>
          <ul className="space-y-2 text-sm">
            {recentActivity.map((item) => (
              <li key={item.id}>
                <span className="font-medium capitalize">{item.type}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {item.title} · {item.status} · {new Date(item.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
