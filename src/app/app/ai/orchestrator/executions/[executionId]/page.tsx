import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AI_ORCHESTRATOR_ROUTES } from "@/modules/ai-orchestrator-management/constants/routes";

export const metadata: Metadata = {
  title: "Execution Details",
};

interface OrchestratorExecutionRedirectPageProps {
  params: Promise<{ executionId: string }>;
}

export default async function OrchestratorExecutionRedirectPage({
  params,
}: OrchestratorExecutionRedirectPageProps) {
  const { executionId } = await params;
  redirect(AI_ORCHESTRATOR_ROUTES.execution(executionId));
}
