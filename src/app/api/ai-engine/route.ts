import { NextResponse } from "next/server";

import { aiEngine } from "@/modules/ai-engine/engine/ai-engine";
import { PLATFORM_MODULE_KEYS } from "@/modules/feature-access";
import { assertPlatformModuleFromContext } from "@/modules/feature-access/guards/platform-feature.guard";
import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";

export async function GET() {
  try {
    await protectedRoute();
    return NextResponse.json({ success: true, data: aiEngine.listProviders() });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const platform = await protectedRoute();
    await assertPlatformModuleFromContext(platform, PLATFORM_MODULE_KEYS.AI);

    const body = (await request.json()) as {
      message?: string;
      conversationId?: string;
      currentModule?: string;
      model?: string;
      providerId?: "openai" | "anthropic" | "google-gemini" | "azure-openai" | "mock-fallback";
      enableTools?: boolean;
      action?: "chat" | "insight";
      prompt?: string;
      contextData?: Record<string, unknown>;
      responseFormat?: "text" | "json";
    };

    if (body.action === "insight") {
      const result = await aiEngine.generateInsight(platform, {
        prompt: body.prompt ?? body.message ?? "",
        currentModule: body.currentModule ?? "platform",
        contextData: body.contextData,
        responseFormat: body.responseFormat ?? "text",
      });

      return NextResponse.json({ success: true, data: result });
    }

    if (!body.message?.trim()) {
      return NextResponse.json({ success: false, error: "message is required" }, { status: 400 });
    }

    const result = await aiEngine.chat(platform, {
      message: body.message,
      conversationId: body.conversationId,
      currentModule: body.currentModule,
      model: body.model,
      providerId: body.providerId,
      enableTools: body.enableTools,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}
