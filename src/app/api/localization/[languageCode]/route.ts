import { NextResponse } from "next/server";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";
import { SUPPORTED_LANGUAGE_CODES } from "@/modules/localization-platform/constants/routes";
import {
  getLocalizationApiPayload,
  resolveLocalizationContext,
} from "@/services/localization-platform.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ languageCode: string }> },
) {
  try {
    const platform = await protectedRoute({
      permission: PERMISSION_CODES.LOCALIZATION_PLATFORM_VIEW,
    });
    const { languageCode } = await context.params;

    if (!(SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(languageCode)) {
      return NextResponse.json({ success: false, error: "Unsupported language" }, { status: 400 });
    }

    const [payload, localeContext] = await Promise.all([
      getLocalizationApiPayload(platform.business.id, languageCode),
      resolveLocalizationContext(platform),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...payload,
        context: localeContext,
      },
    });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}
