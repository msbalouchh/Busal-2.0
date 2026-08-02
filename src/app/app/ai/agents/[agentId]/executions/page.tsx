import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AI_AGENT_PLATFORM_ROUTES } from "@/modules/ai-agent-platform-management/constants/routes";

export const metadata: Metadata = {
  title: "Agent Executions",
};

interface AgentExecutionsRedirectPageProps {
  params: Promise<{ agentId: string }>;
}

export default async function AgentExecutionsRedirectPage({
  params,
}: AgentExecutionsRedirectPageProps) {
  const { agentId } = await params;
  redirect(AI_AGENT_PLATFORM_ROUTES.executions(agentId));
}
