import "server-only";

import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterPage } from "@/modules/control-center/guards/control-center.guards";
import type {
  ControlCenterIncidentQuery,
  ControlCenterKnowledgeQuery,
  ControlCenterTicketQuery,
} from "@/modules/control-center/support/types/control-center-support-types";
import { getControlCenterSupportManagementBundle } from "@/services/control-center-support.service";

export const getControlCenterSupportContext = cache(
  async (
    ticketQuery: ControlCenterTicketQuery = {},
    incidentQuery: ControlCenterIncidentQuery = {},
    knowledgeQuery: ControlCenterKnowledgeQuery = {},
  ) => {
    const operator = await protectedControlCenterPage({
      permission: PERMISSION_CODES.CONTROL_CENTER_SUPPORT,
    });

    return getControlCenterSupportManagementBundle(
      operator,
      ticketQuery,
      incidentQuery,
      knowledgeQuery,
    );
  },
);
