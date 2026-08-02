"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterAction } from "@/modules/control-center/guards/control-center.guards";
import { CONTROL_CENTER_SUPPORT_ROUTES } from "@/modules/control-center/support/constants/control-center-support";
import type {
  AssignControlCenterIncidentInput,
  ControlCenterIncidentQuery,
  ControlCenterKnowledgeQuery,
  ControlCenterTicketQuery,
  CreateControlCenterIncidentInput,
  UpdateControlCenterIncidentPostmortemInput,
} from "@/modules/control-center/support/types/control-center-support-types";
import {
  getControlCenterSupportManagementBundle,
  getControlCenterTicketDetail,
  queryControlCenterKnowledgeArticles,
  queryControlCenterSupportIncidents,
  queryControlCenterTickets,
  runControlCenterAddIncidentNote,
  runControlCenterAddTicketNote,
  runControlCenterArchiveKnowledgeArticle,
  runControlCenterAssignIncident,
  runControlCenterAssignTicket,
  runControlCenterCloseTicket,
  runControlCenterCreateIncident,
  runControlCenterDraftKnowledgeArticle,
  runControlCenterMergeTickets,
  runControlCenterPublishKnowledgeArticle,
  runControlCenterResolveSupportIncident,
  runControlCenterUpdateIncidentPostmortem,
} from "@/services/control-center-support.service";

function revalidateSupportPages() {
  revalidatePath(CONTROL_CENTER_SUPPORT_ROUTES.overview);
  revalidatePath(CONTROL_CENTER_SUPPORT_ROUTES.incidents);
}

export async function refreshControlCenterSupportBundleAction(
  ticketQuery: ControlCenterTicketQuery = {},
  incidentQuery: ControlCenterIncidentQuery = {},
  knowledgeQuery: ControlCenterKnowledgeQuery = {},
) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SUPPORT,
    async ({ operator }) =>
      getControlCenterSupportManagementBundle(operator, ticketQuery, incidentQuery, knowledgeQuery),
  );
}

export async function queryControlCenterTicketsAction(query: ControlCenterTicketQuery) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_SUPPORT, async () =>
    queryControlCenterTickets(query),
  );
}

export async function getControlCenterTicketDetailAction(ticketId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SUPPORT,
    async ({ operator }) => getControlCenterTicketDetail(ticketId, operator),
  );
}

export async function queryControlCenterSupportIncidentsAction(query: ControlCenterIncidentQuery) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_SUPPORT, async () =>
    queryControlCenterSupportIncidents(query),
  );
}

export async function queryControlCenterKnowledgeArticlesAction(
  query: ControlCenterKnowledgeQuery,
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_SUPPORT, async () =>
    queryControlCenterKnowledgeArticles(query),
  );
}

export async function assignControlCenterTicketAction(ticketId: string, assignedStaffId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SUPPORT,
    async ({ operator }) => {
      await runControlCenterAssignTicket(operator, ticketId, assignedStaffId);
      revalidateSupportPages();
    },
  );
}

export async function closeControlCenterTicketAction(ticketId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SUPPORT,
    async ({ operator }) => {
      await runControlCenterCloseTicket(operator, ticketId);
      revalidateSupportPages();
    },
  );
}

export async function addControlCenterTicketNoteAction(ticketId: string, body: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SUPPORT,
    async ({ operator }) => {
      await runControlCenterAddTicketNote(operator, ticketId, body);
      revalidateSupportPages();
    },
  );
}

export async function mergeControlCenterTicketsAction(
  primaryTicketId: string,
  mergedTicketId: string,
) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SUPPORT,
    async ({ operator }) => {
      await runControlCenterMergeTickets(operator, primaryTicketId, mergedTicketId);
      revalidateSupportPages();
    },
  );
}

export async function createControlCenterIncidentAction(input: CreateControlCenterIncidentInput) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SUPPORT,
    async ({ operator }) => {
      const result = await runControlCenterCreateIncident(operator, input);
      revalidateSupportPages();
      return result;
    },
  );
}

export async function assignControlCenterIncidentAction(input: AssignControlCenterIncidentInput) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SUPPORT,
    async ({ operator }) => {
      await runControlCenterAssignIncident(operator, input);
      revalidateSupportPages();
    },
  );
}

export async function resolveControlCenterSupportIncidentAction(
  incidentId: string,
  rootCause?: string,
) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SUPPORT,
    async ({ operator }) => {
      await runControlCenterResolveSupportIncident(operator, incidentId, rootCause);
      revalidateSupportPages();
    },
  );
}

export async function updateControlCenterIncidentPostmortemAction(
  input: UpdateControlCenterIncidentPostmortemInput,
) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SUPPORT,
    async ({ operator }) => {
      await runControlCenterUpdateIncidentPostmortem(operator, input);
      revalidateSupportPages();
    },
  );
}

export async function addControlCenterIncidentNoteAction(
  incidentId: string,
  body: string,
  mentions: string[] = [],
) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SUPPORT,
    async ({ operator }) => {
      await runControlCenterAddIncidentNote(operator, incidentId, body, mentions);
      revalidateSupportPages();
    },
  );
}

export async function publishControlCenterKnowledgeArticleAction(documentId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_SUPPORT, async () => {
    await runControlCenterPublishKnowledgeArticle(documentId);
    revalidateSupportPages();
  });
}

export async function archiveControlCenterKnowledgeArticleAction(documentId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_SUPPORT, async () => {
    await runControlCenterArchiveKnowledgeArticle(documentId);
    revalidateSupportPages();
  });
}

export async function draftControlCenterKnowledgeArticleAction(documentId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_SUPPORT, async () => {
    await runControlCenterDraftKnowledgeArticle(documentId);
    revalidateSupportPages();
  });
}
