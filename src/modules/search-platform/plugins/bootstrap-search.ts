import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { SEARCH_ENTITY_TYPES } from "@/modules/search-platform/constants/routes";
import {
  listSearchableEntities,
  registerSearchableEntity,
} from "@/modules/search-platform/registry/search-registry";

const ENTITY_PERMISSION_MAP: Record<(typeof SEARCH_ENTITY_TYPES)[number], string> = {
  CUSTOMER: PERMISSION_CODES.CRM_VIEW,
  STAFF: PERMISSION_CODES.STAFF_VIEW,
  BUSINESS: PERMISSION_CODES.BUSINESS_VIEW,
  BRANCH: PERMISSION_CODES.BRANCH_VIEW,
  ORDER: PERMISSION_CODES.ORDER_VIEW,
  RESERVATION: PERMISSION_CODES.RESERVATION_VIEW,
  TABLE: PERMISSION_CODES.TABLE_MANAGE,
  MENU_ITEM: PERMISSION_CODES.MENU_VIEW,
  INVENTORY: PERMISSION_CODES.INVENTORY_VIEW,
  SUPPLIER: PERMISSION_CODES.INVENTORY_VIEW,
  CRM: PERMISSION_CODES.CRM_VIEW,
  LEAD: PERMISSION_CODES.SALES_VIEW,
  OPPORTUNITY: PERMISSION_CODES.SALES_VIEW,
  QUOTE: PERMISSION_CODES.QUOTES_VIEW,
  CONTRACT: PERMISSION_CODES.CONTRACTS_VIEW,
  PROJECT: PERMISSION_CODES.IMPLEMENTATION_VIEW,
  FILE: PERMISSION_CODES.FILES_VIEW,
  CONVERSATION: PERMISSION_CODES.COMMUNICATION_VIEW,
  AI_KNOWLEDGE: PERMISSION_CODES.AI_KNOWLEDGE_VIEW,
  MARKETPLACE_ASSET: PERMISSION_CODES.MARKETPLACE_VIEW,
  REPORT: PERMISSION_CODES.ANALYTICS_VIEW,
  WORKFLOW: PERMISSION_CODES.AI_AUTOMATION_VIEW,
};

const ENTITY_MODULE_MAP: Record<(typeof SEARCH_ENTITY_TYPES)[number], string> = {
  CUSTOMER: "crm",
  STAFF: "staff",
  BUSINESS: "business",
  BRANCH: "branches",
  ORDER: "orders",
  RESERVATION: "reservations",
  TABLE: "tables",
  MENU_ITEM: "menu",
  INVENTORY: "inventory",
  SUPPLIER: "inventory",
  CRM: "crm",
  LEAD: "sales-crm",
  OPPORTUNITY: "sales-crm",
  QUOTE: "quotes",
  CONTRACT: "contracts",
  PROJECT: "implementation",
  FILE: "files",
  CONVERSATION: "communication",
  AI_KNOWLEDGE: "ai-knowledge",
  MARKETPLACE_ASSET: "marketplace",
  REPORT: "reporting",
  WORKFLOW: "ai-automation",
};

const ENTITY_DEFAULT_FIELDS: Record<(typeof SEARCH_ENTITY_TYPES)[number], string[]> = {
  CUSTOMER: ["name", "email", "phone"],
  STAFF: ["name", "email", "role"],
  BUSINESS: ["name", "industry"],
  BRANCH: ["name", "address"],
  ORDER: ["orderNumber", "customerName"],
  RESERVATION: ["guestName", "notes"],
  TABLE: ["name", "section"],
  MENU_ITEM: ["name", "category"],
  INVENTORY: ["name", "sku"],
  SUPPLIER: ["name", "contact"],
  CRM: ["name", "company"],
  LEAD: ["name", "source"],
  OPPORTUNITY: ["title", "stage"],
  QUOTE: ["quoteNumber", "customer"],
  CONTRACT: ["contractNumber", "title"],
  PROJECT: ["name", "status"],
  FILE: ["filename", "tags"],
  CONVERSATION: ["subject", "participants"],
  AI_KNOWLEDGE: ["title", "content"],
  MARKETPLACE_ASSET: ["name", "category"],
  REPORT: ["name", "type"],
  WORKFLOW: ["name", "trigger"],
};

let bootstrapped = false;

export function ensureBootstrapSearchPlatform(): void {
  if (bootstrapped) {
    return;
  }

  for (const entityType of SEARCH_ENTITY_TYPES) {
    registerSearchableEntity({
      entityType,
      label: entityType.replace(/_/g, " "),
      requiredPermission: ENTITY_PERMISSION_MAP[entityType],
      defaultFields: ENTITY_DEFAULT_FIELDS[entityType],
      module: ENTITY_MODULE_MAP[entityType],
    });
  }

  bootstrapped = true;
}

export function resetBootstrapSearchPlatform(): void {
  bootstrapped = false;
}

export const DEFAULT_SEARCH_ENTITY_TYPES = SEARCH_ENTITY_TYPES;

export function getRegisteredEntityCount(): number {
  ensureBootstrapSearchPlatform();
  return listSearchableEntities().length;
}
