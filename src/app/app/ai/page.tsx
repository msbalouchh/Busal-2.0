import Link from "next/link";
import { Bot } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AI_AGENT_PLATFORM_ROUTES } from "@/modules/ai-agent-platform-management/constants/routes";
import { AI_MEMORY_ROUTES } from "@/modules/ai-memory-management/constants/routes";
import { AI_SKILLS_ROUTES } from "@/modules/ai-skills-management/constants/routes";
import { AI_ORCHESTRATOR_ROUTES } from "@/modules/ai-orchestrator-management/constants/routes";
import { AI_SALES_AGENT_ROUTES } from "@/modules/ai-sales-agent-management/constants/routes";
import { AI_MARKETING_AGENT_ROUTES } from "@/modules/ai-marketing-agent-management/constants/routes";
import { AI_SUPPORT_AGENT_ROUTES } from "@/modules/ai-support-agent-management/constants/routes";
import { AI_HR_AGENT_ROUTES } from "@/modules/ai-hr-agent-management/constants/routes";
import { AI_FINANCE_AGENT_ROUTES } from "@/modules/ai-finance-agent-management/constants/routes";
import { AI_OPERATIONS_AGENT_ROUTES } from "@/modules/ai-operations-agent-management/constants/routes";
import { AI_VOICE_AGENT_ROUTES } from "@/modules/ai-voice-agent-management/constants/routes";
import { AI_RESTAURANT_ASSISTANT_ROUTES } from "@/modules/ai-restaurant-assistant-management/constants/routes";

export default function ApplicationAiPage() {
  return (
    <ApplicationPageTemplate
      title="AI"
      description="Busal AI platform — agents, assistants, and operational intelligence."
      icon={Bot}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI" },
      ]}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Agent Platform</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Register, configure, and manage AI agents that plug into Busal OS.
            </p>
            <Button asChild>
              <Link href={AI_AGENT_PLATFORM_ROUTES.dashboard()}>Open agent platform</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Restaurant AI Assistant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Chat, insights, and recommendations powered by your restaurant data.
            </p>
            <Button asChild variant="outline">
              <Link href={AI_RESTAURANT_ASSISTANT_ROUTES.dashboard()}>Open assistant</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Memory Engine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Centralized memory for every AI agent — business, customer, staff, and conversation
              context.
            </p>
            <Button asChild variant="outline">
              <Link href={AI_MEMORY_ROUTES.dashboard()}>Open memory engine</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Skills Library</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Shared capability layer — register, configure, and execute skills for every AI agent.
            </p>
            <Button asChild variant="outline">
              <Link href={AI_SKILLS_ROUTES.dashboard()}>Open skills library</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Orchestrator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Coordinate agents and skills into multi-step workflows for complex business tasks.
            </p>
            <Button asChild variant="outline">
              <Link href={AI_ORCHESTRATOR_ROUTES.dashboard()}>Open orchestrator</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Sales Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Revenue insights, pipeline analysis, and sales recommendations for every industry.
            </p>
            <Button asChild variant="outline">
              <Link href={AI_SALES_AGENT_ROUTES.dashboard()}>Open sales agent</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Marketing Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Campaign insights, audience analytics, and promotion recommendations for every
              industry.
            </p>
            <Button asChild variant="outline">
              <Link href={AI_MARKETING_AGENT_ROUTES.dashboard()}>Open marketing agent</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Support Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Ticket insights, response suggestions, and satisfaction analysis for every industry.
            </p>
            <Button asChild variant="outline">
              <Link href={AI_SUPPORT_AGENT_ROUTES.dashboard()}>Open support agent</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI HR Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Workforce insights, performance analytics, and HR recommendations for every industry.
            </p>
            <Button asChild variant="outline">
              <Link href={AI_HR_AGENT_ROUTES.dashboard()}>Open HR agent</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Finance Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Revenue, expenses, cash flow, and financial health insights for every industry.
            </p>
            <Button asChild variant="outline">
              <Link href={AI_FINANCE_AGENT_ROUTES.dashboard()}>Open finance agent</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Operations Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Operational health, workflow analysis, and efficiency recommendations for every
              industry.
            </p>
            <Button asChild variant="outline">
              <Link href={AI_OPERATIONS_AGENT_ROUTES.dashboard()}>Open operations agent</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Voice Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Voice sessions, command routing, and provider-agnostic speech abstraction for every
              industry.
            </p>
            <Button asChild variant="outline">
              <Link href={AI_VOICE_AGENT_ROUTES.dashboard()}>Open voice agent</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </ApplicationPageTemplate>
  );
}
