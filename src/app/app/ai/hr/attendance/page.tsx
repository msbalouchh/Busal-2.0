import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { HrAttendancePanel } from "@/modules/ai-hr-agent-management/components/hr-attendance-panel";
import { getHrAttendanceContext } from "@/modules/ai-hr-agent-management/lib/get-ai-hr-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Attendance Analytics" };
}

export default async function AiHrAttendancePage() {
  const context = await getHrAttendanceContext();

  return (
    <ApplicationPageTemplate
      title="Attendance Analytics"
      description="Engagement, leave patterns, and shift coverage analysis."
      icon={CalendarDays}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "HR Agent", href: "/app/ai/hr" },
        { label: "Attendance" },
      ]}
    >
      <HrAttendancePanel
        attendance={context.attendance}
        leavePatterns={context.leavePatterns}
        shiftCoverage={context.shiftCoverage}
      />
    </ApplicationPageTemplate>
  );
}
