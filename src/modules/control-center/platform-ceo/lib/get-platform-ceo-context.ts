import "server-only";

import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterPage } from "@/modules/control-center/guards/control-center.guards";
import type { PlatformCeoConversationQuery } from "@/modules/control-center/platform-ceo/types/platform-ceo.types";
import { getPlatformCeoHubBundle } from "@/services/control-center-platform-ceo.service";

export const getPlatformCeoContext = cache(
  async (options: {
    conversationId?: string | null;
    search?: string;
    status?: PlatformCeoConversationQuery["status"];
  } = {}) => {
    const operator = await protectedControlCenterPage({
      permission: PERMISSION_CODES.CONTROL_CENTER_CEO,
    });

    return getPlatformCeoHubBundle(operator, {
      conversationId: options.conversationId,
      conversationQuery: {
        search: options.search,
        status: options.status ?? "all",
        limit: 20,
      },
    });
  },
);
