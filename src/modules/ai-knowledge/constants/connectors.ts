import type { KnowledgeConnectorType } from "@prisma/client";

import type { KnowledgeConnectorDefinition } from "@/modules/ai-knowledge/types/knowledge-types";

export const KNOWLEDGE_CONNECTOR_DEFINITIONS: Record<
  KnowledgeConnectorType,
  KnowledgeConnectorDefinition
> = {
  GOOGLE_DRIVE: {
    connectorType: "GOOGLE_DRIVE",
    label: "Google Drive",
    integrationReady: false,
  },
  ONEDRIVE: {
    connectorType: "ONEDRIVE",
    label: "OneDrive",
    integrationReady: false,
  },
  SHAREPOINT: {
    connectorType: "SHAREPOINT",
    label: "SharePoint",
    integrationReady: false,
  },
  CONFLUENCE: {
    connectorType: "CONFLUENCE",
    label: "Confluence",
    integrationReady: false,
  },
  NOTION: {
    connectorType: "NOTION",
    label: "Notion",
    integrationReady: false,
  },
  DROPBOX: {
    connectorType: "DROPBOX",
    label: "Dropbox",
    integrationReady: false,
  },
  GITHUB: {
    connectorType: "GITHUB",
    label: "GitHub",
    integrationReady: false,
  },
  MANUAL: {
    connectorType: "MANUAL",
    label: "Manual Upload",
    integrationReady: true,
  },
};

export const PLANNED_KNOWLEDGE_CONNECTORS = Object.values(KNOWLEDGE_CONNECTOR_DEFINITIONS).filter(
  (connector) => connector.connectorType !== "MANUAL",
);
