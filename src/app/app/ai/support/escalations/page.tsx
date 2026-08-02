import type { Metadata } from "next";
import { Headphones } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SupportEscalationsPanel } from "@/modules/ai-support-agent-management/components/support-escalations-panel";
import { getSupportEscalationsContext } from "@/modules/ai-support-agent-management/lib/get-ai-support-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Escalations" };
}

export default async function AiSupportEscalationsPage() {
  const context = await getSupportEscalationsContext();

  return (
    <ApplicationPageTemplate
      title="Escalation Center"
      description="Tickets requiring urgent attention or supervisor escalation."
      icon={Headphones}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Support Agent", href: "/app/ai/support" },
        { label: "Escalations" },
      ]}
    >
      <SupportEscalationsPanel escalations={context.escalations} />
    </ApplicationPageTemplate>
  );
}
