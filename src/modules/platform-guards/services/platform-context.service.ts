import "server-only";

import { cache } from "react";

import { requireBusinessContext } from "@/modules/business-context/services/business-context.service";
import type { PlatformContext } from "@/modules/platform-guards/types/platform-context";

export const getPlatformContext = cache(async (): Promise<PlatformContext> => {
  return requireBusinessContext();
});
