import { NextResponse } from "next/server";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";
import type {
  ExportJobInput,
  ImportJobInput,
} from "@/modules/import-export-platform/types/import-export-platform-types";
import {
  getImportExportApiPayload,
  runExportJob,
  runImportJob,
} from "@/services/import-export-platform.service";

export async function GET(_request: Request, context: { params: Promise<{ schemaKey: string }> }) {
  try {
    const platform = await protectedRoute({
      permission: PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_VIEW,
    });
    const { schemaKey } = await context.params;
    const payload = await getImportExportApiPayload(platform.business.id, schemaKey);

    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ schemaKey: string }> }) {
  try {
    const platform = await protectedRoute({
      permission: PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_MANAGE,
    });
    const { schemaKey } = await context.params;
    const body = (await request.json()) as {
      jobType: "IMPORT" | "EXPORT";
      format: ImportJobInput["format"];
      content?: string;
      fileName?: string;
      records?: Array<Record<string, unknown>>;
    };

    if (body.jobType === "IMPORT") {
      const result = await runImportJob(platform, {
        schemaKey,
        format: body.format,
        content: body.content ?? "[]",
        fileName: body.fileName,
        source: "API",
      });
      return NextResponse.json({ success: true, data: result });
    }

    const result = await runExportJob(platform, {
      schemaKey,
      format: body.format as ExportJobInput["format"],
      fileName: body.fileName,
      records: body.records,
      source: "API",
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}
