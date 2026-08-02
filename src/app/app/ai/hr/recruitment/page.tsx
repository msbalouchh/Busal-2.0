import type { Metadata } from "next";
import { UserPlus } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { HrRecruitmentPanel } from "@/modules/ai-hr-agent-management/components/hr-recruitment-panel";
import { getHrRecruitmentContext } from "@/modules/ai-hr-agent-management/lib/get-ai-hr-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Recruitment Insights" };
}

export default async function AiHrRecruitmentPage() {
  const context = await getHrRecruitmentContext();

  return (
    <ApplicationPageTemplate
      title="Recruitment Insights"
      description="Invitation pipeline analysis and candidate evaluation."
      icon={UserPlus}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "HR Agent", href: "/app/ai/hr" },
        { label: "Recruitment" },
      ]}
    >
      <HrRecruitmentPanel recruitment={context.recruitment} candidates={context.candidates} />
    </ApplicationPageTemplate>
  );
}
