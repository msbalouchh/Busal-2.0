import { NextResponse } from "next/server";

import { aiToolExecutionFacade } from "@/modules/ai-engine/tools/tool-execution-facade";
import { PLATFORM_MODULE_KEYS } from "@/modules/feature-access";
import { assertPlatformModuleFromContext } from "@/modules/feature-access/guards/platform-feature.guard";
import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";

export async function POST(request: Request) {
  try {
    const platform = await protectedRoute();
    await assertPlatformModuleFromContext(platform, PLATFORM_MODULE_KEYS.AI);

    const body = (await request.json()) as {
      toolId: string;
      input?: Record<string, unknown>;
      currentModule?: string;
      confirmed?: boolean;
    };

    const { executeAiTool } = await import("@/services/ai-tools.service");
    const result = await executeAiTool(platform, {
      toolId: body.toolId,
      input: body.input ?? {},
      currentModule: body.currentModule,
      confirmed: body.confirmed ?? true,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function GET(request: Request) {
  try {
    const platform = await protectedRoute();
    await assertPlatformModuleFromContext(platform, PLATFORM_MODULE_KEYS.AI);

    const url = new URL(request.url);
    const currentModule = url.searchParams.get("module");

    const tools = aiToolExecutionFacade.listAvailableTools(platform, currentModule);
    return NextResponse.json({ success: true, data: tools });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}
