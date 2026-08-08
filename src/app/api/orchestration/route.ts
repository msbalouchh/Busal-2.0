import {
  handleListOrchestrationEvents,
  handleOrchestrationOverview,
  handlePublishDomainEvent,
} from "@/modules/platform-orchestration/api/orchestration-route-handlers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("events") === "true") {
    return handleListOrchestrationEvents(request);
  }
  return handleOrchestrationOverview(request);
}

export async function POST(request: Request) {
  return handlePublishDomainEvent(request);
}
