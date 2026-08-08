import { NextResponse } from "next/server";

import { aiEngine } from "@/modules/ai-engine/engine/ai-engine";
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
      message: string;
      conversationId?: string;
      currentModule?: string;
      model?: string;
    };

    const encoder = new TextEncoder();
    const result = await aiEngine.chat(platform, {
      message: body.message,
      conversationId: body.conversationId,
      currentModule: body.currentModule,
      model: body.model,
      enableTools: true,
    });

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const chunks = result.content.match(/.{1,80}/g) ?? [result.content];
        for (const chunk of chunks) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ delta: chunk, done: false })}\n\n`),
          );
        }
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              done: true,
              conversationId: result.conversationId,
              auditId: result.auditId,
              model: result.model,
              providerId: result.providerId,
            })}\n\n`,
          ),
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}
