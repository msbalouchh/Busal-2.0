import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { ensureBootstrapKnowledgeTools } from "@/modules/ai-knowledge/plugins/knowledge-tools";
import { registerAllPlatformAiTools } from "@/modules/ai-tools/plugins/register-platform-ai-tools";
import { registerTool } from "@/modules/ai-tools/registry/tool-registry";
import { listCustomers } from "@/services/crm.service";
import { getReportingDashboard } from "@/services/reporting.service";
import { listStaffMembers } from "@/services/staff-management.service";
import { getRevopsDashboard } from "@/services/revops.service";

const emptyObjectSchema = {
  type: "object",
  properties: {},
} as const;

const staffIdsSchema = {
  type: "object",
  required: ["staffIds"],
  properties: {
    staffIds: { type: "array", items: { type: "string" } },
  },
} as const;

const priceUpdateSchema = {
  type: "object",
  required: ["productIds", "percentChange"],
  properties: {
    productIds: { type: "array", items: { type: "string" } },
    percentChange: { type: "number" },
  },
} as const;

export function registerBootstrapAiTools(): void {
  registerTool(
    {
      toolId: "crm.list_customers",
      name: "List Customers",
      description: "List CRM customers for the active business.",
      module: "crm",
      category: "CRM",
      inputSchema: emptyObjectSchema,
      outputSchema: {
        type: "object",
        properties: {
          count: { type: "number" },
          customers: { type: "array" },
        },
      },
      requiredPermissions: [PERMISSION_CODES.CRM_VIEW],
      riskLevel: "READ_ONLY",
      readOnly: true,
      dryRunSupported: true,
    },
    async (context) => {
      const customers = await listCustomers(context.business.id);
      return {
        count: customers.length,
        customers: customers.map((customer) => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
        })),
      };
    },
  );

  registerTool(
    {
      toolId: "reporting.get_dashboard",
      name: "Get Reporting Dashboard",
      description: "Fetch analytics dashboard metrics for the active business.",
      module: "reporting",
      category: "REPORTING",
      inputSchema: emptyObjectSchema,
      outputSchema: { type: "object" },
      requiredPermissions: [PERMISSION_CODES.ANALYTICS_VIEW],
      riskLevel: "READ_ONLY",
      readOnly: true,
      dryRunSupported: true,
    },
    async (context) => {
      const dashboard = await getReportingDashboard(context.business.id, context.branchId);
      return { dashboard };
    },
  );

  registerTool(
    {
      toolId: "staff.list_members",
      name: "List Staff Members",
      description: "List staff members for the active business and branch context.",
      module: "staff",
      category: "STAFF",
      inputSchema: emptyObjectSchema,
      outputSchema: { type: "object" },
      requiredPermissions: [PERMISSION_CODES.STAFF_VIEW],
      riskLevel: "READ_ONLY",
      readOnly: true,
      dryRunSupported: true,
    },
    async (context) => {
      const members = await listStaffMembers(context.business.id, context.branchId ?? undefined);
      return {
        count: members.length,
        members: members.map((member) => ({
          id: member.id,
          name: `${member.firstName} ${member.lastName}`.trim(),
          email: member.email,
          roleSlug: member.roles[0]?.slug ?? null,
        })),
      };
    },
  );

  registerTool(
    {
      toolId: "revops.get_dashboard",
      name: "Get RevOps Dashboard",
      description: "Fetch revenue operations dashboard metrics.",
      module: "revops",
      category: "REVENUE",
      inputSchema: emptyObjectSchema,
      outputSchema: { type: "object" },
      requiredPermissions: [PERMISSION_CODES.REVENUE_VIEW],
      riskLevel: "READ_ONLY",
      readOnly: true,
      dryRunSupported: true,
    },
    async (context) => {
      const dashboard = await getRevopsDashboard(context.business.id);
      return { dashboard };
    },
  );

  registerTool(
    {
      toolId: "admin.bulk_staff_removal",
      name: "Bulk Staff Removal",
      description: "Remove multiple staff members from the business.",
      module: "staff",
      category: "ADMINISTRATION",
      inputSchema: staffIdsSchema,
      outputSchema: {
        type: "object",
        properties: {
          removedCount: { type: "number" },
          staffIds: { type: "array" },
        },
      },
      requiredPermissions: [PERMISSION_CODES.STAFF_DELETE],
      riskLevel: "HIGH_RISK",
      confirmationRequired: true,
      dryRunSupported: true,
      rollbackCapable: false,
    },
    async (context, input) => {
      const staffIds = Array.isArray(input.staffIds)
        ? input.staffIds.filter((value): value is string => typeof value === "string")
        : [];

      return {
        removedCount: staffIds.length,
        staffIds,
        businessId: context.business.id,
        simulated: true,
      };
    },
  );

  registerTool(
    {
      toolId: "admin.delete_business",
      name: "Delete Business",
      description: "Permanently delete the active business.",
      module: "business",
      category: "ADMINISTRATION",
      inputSchema: {
        type: "object",
        required: ["confirmName"],
        properties: {
          confirmName: { type: "string" },
        },
      },
      outputSchema: { type: "object" },
      requiredPermissions: [PERMISSION_CODES.BUSINESS_UPDATE],
      riskLevel: "HIGH_RISK",
      confirmationRequired: true,
      dryRunSupported: true,
    },
    async (context, input) => {
      const confirmName = typeof input.confirmName === "string" ? input.confirmName : "";
      return {
        businessId: context.business.id,
        confirmName,
        deleted: false,
        simulated: true,
      };
    },
  );

  registerTool(
    {
      toolId: "commercial.bulk_price_update",
      name: "Bulk Price Update",
      description: "Apply a percentage price change to multiple commercial products.",
      module: "commercial",
      category: "COMMERCIAL",
      inputSchema: priceUpdateSchema,
      outputSchema: { type: "object" },
      requiredPermissions: [PERMISSION_CODES.COMMERCIAL_MANAGE_PRICES],
      riskLevel: "HIGH_RISK",
      confirmationRequired: true,
      dryRunSupported: true,
      rollbackCapable: true,
    },
    async (context, input) => {
      const productIds = Array.isArray(input.productIds)
        ? input.productIds.filter((value): value is string => typeof value === "string")
        : [];
      const percentChange = typeof input.percentChange === "number" ? input.percentChange : 0;

      return {
        businessId: context.business.id,
        productIds,
        percentChange,
        updatedCount: productIds.length,
        simulated: true,
      };
    },
  );
}

let bootstrapComplete = false;

export function ensureBootstrapAiTools(): void {
  if (bootstrapComplete) {
    return;
  }

  registerBootstrapAiTools();
  registerAllPlatformAiTools();
  ensureBootstrapKnowledgeTools();
  bootstrapComplete = true;
}
