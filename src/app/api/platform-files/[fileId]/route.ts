import { readFileSync } from "node:fs";
import { join } from "node:path";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";

interface RouteParams {
  params: Promise<{ fileId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const platform = await protectedRoute({ permission: PERMISSION_CODES.FILES_VIEW });
    const { fileId } = await params;

    const file = await prisma.platformFile.findFirst({
      where: {
        id: fileId,
        businessId: platform.business.id,
        deletedAt: null,
        status: "ACTIVE",
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const uploadsRoot = join(process.cwd(), ".platform-uploads");
    const filePath = join(uploadsRoot, file.storageKey);

    try {
      const content = readFileSync(filePath);
      return new NextResponse(content, {
        headers: {
          "Content-Type": file.mimeType,
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch {
      return NextResponse.json(
        {
          id: file.id,
          originalName: file.originalName,
          mimeType: file.mimeType,
          storageKey: file.storageKey,
          module: file.module,
          entityType: file.entityType,
        },
        { status: 200 },
      );
    }
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}
