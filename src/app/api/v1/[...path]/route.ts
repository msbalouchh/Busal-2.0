import { dispatchV1ApiRequest } from "@/modules/platform/api/v1/router";

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

async function handleRequest(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return dispatchV1ApiRequest(request, path);
}

export async function GET(request: Request, context: RouteContext) {
  return handleRequest(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return handleRequest(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleRequest(request, context);
}

export async function PUT(request: Request, context: RouteContext) {
  return handleRequest(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return handleRequest(request, context);
}
