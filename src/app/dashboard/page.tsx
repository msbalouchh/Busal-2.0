import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/common/empty-state";
import { PageContainer } from "@/components/common/page-container";

export default function DashboardPage() {
  return (
    <DashboardShell title="Dashboard">
      <PageContainer title="Dashboard" description="Your business operating system command center.">
        <EmptyState
          title="Dashboard shell ready"
          description="Foundation is configured. Business modules will appear here in future releases."
        />
      </PageContainer>
    </DashboardShell>
  );
}
