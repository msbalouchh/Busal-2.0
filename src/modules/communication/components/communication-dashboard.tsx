import type { CommunicationDashboardView } from "@/modules/communication/utils/communication-utils";

interface CommunicationDashboardProps {
  dashboard: CommunicationDashboardView;
}

export function CommunicationDashboard({ dashboard }: CommunicationDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Total Conversations</p>
        <p className="text-2xl font-semibold">{dashboard.totalConversations}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Open</p>
        <p className="text-2xl font-semibold">{dashboard.openConversations}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Waiting for Staff</p>
        <p className="text-2xl font-semibold">{dashboard.waitingStaff}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">AI Handled</p>
        <p className="text-2xl font-semibold">{dashboard.aiHandled}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Unread Messages</p>
        <p className="text-2xl font-semibold">{dashboard.unreadMessages}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Channels Configured</p>
        <p className="text-2xl font-semibold">{dashboard.channelsConfigured}</p>
      </div>
    </div>
  );
}
