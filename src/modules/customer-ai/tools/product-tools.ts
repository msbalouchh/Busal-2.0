import "server-only";

import { prisma } from "@/lib/prisma";
import { listBusinessHours } from "@/services/business-management.service";
import { menuService } from "@/modules/menu/services/menu.service";
import { buildMenuPlatformContext } from "@/modules/menu/services/menu-platform.service";
import { menuSearchSchema } from "@/modules/menu/validation/menu-schemas";
import { CUSTOMER_AI_TOOL_IDS } from "@/modules/customer-ai/constants/customer-ai.constants";
import type { AiBusinessToolDefinition } from "@/modules/customer-ai/tools/tool-types";

export const customerBusinessTools: AiBusinessToolDefinition[] = [
  {
    toolId: CUSTOMER_AI_TOOL_IDS.VIEW_BUSINESS_INFO,
    name: "View Business Information",
    description: "Get public business information including name, contact, and industry.",
    inputSchema: { type: "object", properties: {} },
    permission: "ai.customer.read",
    riskLevel: "READ",
    audience: "BOTH",
    handler: async (_input, context) => {
      const business = await prisma.business.findUniqueOrThrow({
        where: { id: context.businessId },
        select: {
          businessName: true,
          industry: true,
          phone: true,
          businessEmail: true,
          timezone: true,
          currency: true,
          country: true,
        },
      });
      return { business };
    },
  },
  {
    toolId: CUSTOMER_AI_TOOL_IDS.VIEW_HOURS,
    name: "View Opening Hours",
    description: "Get business opening hours for all days of the week.",
    inputSchema: { type: "object", properties: { branchId: { type: "string" } } },
    permission: "ai.customer.read",
    riskLevel: "READ",
    audience: "BOTH",
    handler: async (input, context) => {
      const hours = await listBusinessHours(context.businessId);
      const branchId = typeof input.branchId === "string" ? input.branchId : context.branchId;
      const filtered = branchId
        ? hours.filter((entry) => !entry.branchId || entry.branchId === branchId)
        : hours;
      return { hours: filtered };
    },
  },
];

export const productTools: AiBusinessToolDefinition[] = [
  {
    toolId: CUSTOMER_AI_TOOL_IDS.SEARCH_MENU,
    name: "Search Menu",
    description: "Search the business menu/catalog for items by name or keyword.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" }, limit: { type: "number" } },
    },
    permission: "ai.products.read",
    riskLevel: "READ",
    audience: "BOTH",
    handler: async (input, context) => {
      const menuContext = buildMenuPlatformContext({
        businessId: context.businessId,
        branchId: context.branchId ?? null,
      });
      const query = typeof input.query === "string" ? input.query : "";
      const result = await menuService.searchItems(
        menuSearchSchema.parse({ query, pageSize: 10, page: 1 }),
        menuContext,
      );
      return {
        items: result.records.map((record) => ({
          id: record.item.id,
          name: record.item.name,
          description: record.item.description,
          price: record.pricing.basePricePence / 100,
          available: record.availability.isAvailable,
          categoryId: record.item.categoryId,
        })),
        total: result.total,
      };
    },
  },
  {
    toolId: CUSTOMER_AI_TOOL_IDS.VIEW_MENU,
    name: "View Menu",
    description: "List available menu items from the business catalog.",
    inputSchema: { type: "object", properties: { limit: { type: "number" } } },
    permission: "ai.products.read",
    riskLevel: "READ",
    audience: "BOTH",
    handler: async (input, context) => {
      const menuContext = buildMenuPlatformContext({
        businessId: context.businessId,
        branchId: context.branchId ?? null,
      });
      const limit = typeof input.limit === "number" ? input.limit : 20;
      const result = await menuService.searchItems(
        menuSearchSchema.parse({ pageSize: limit, page: 1 }),
        menuContext,
      );
      return {
        items: result.records.map((record) => ({
          id: record.item.id,
          name: record.item.name,
          price: record.pricing.basePricePence / 100,
          available: record.availability.isAvailable,
        })),
      };
    },
  },
  {
    toolId: CUSTOMER_AI_TOOL_IDS.PRODUCT_DETAILS,
    name: "Product Details",
    description: "Get detailed information about a specific product or menu item.",
    inputSchema: {
      type: "object",
      properties: { productId: { type: "string" }, name: { type: "string" } },
    },
    permission: "ai.products.read",
    riskLevel: "READ",
    audience: "BOTH",
    handler: async (input, context) => {
      if (typeof input.productId === "string") {
        const product = await prisma.product.findFirst({
          where: { id: input.productId, businessId: context.businessId, status: "ACTIVE" },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            category: { select: { name: true } },
          },
        });
        if (!product) return { error: "Product not found." };
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price ? Number(product.price) : null,
          category: product.category?.name ?? null,
        };
      }

      const name = typeof input.name === "string" ? input.name : "";
      const menuContext = buildMenuPlatformContext({
        businessId: context.businessId,
        branchId: context.branchId ?? null,
      });
      const result = await menuService.searchItems(
        menuSearchSchema.parse({ query: name, pageSize: 1, page: 1 }),
        menuContext,
      );
      const record = result.records[0];
      if (!record) return { error: "Product not found." };
      return {
        id: record.item.id,
        name: record.item.name,
        description: record.item.description,
        price: record.pricing.basePricePence / 100,
        available: record.availability.isAvailable,
      };
    },
  },
  {
    toolId: CUSTOMER_AI_TOOL_IDS.PRODUCT_AVAILABILITY,
    name: "Product Availability",
    description: "Check whether a product or menu item is currently available.",
    inputSchema: {
      type: "object",
      properties: { productId: { type: "string" }, name: { type: "string" } },
    },
    permission: "ai.products.read",
    riskLevel: "READ",
    audience: "BOTH",
    handler: async (input, context) => {
      const menuContext = buildMenuPlatformContext({
        businessId: context.businessId,
        branchId: context.branchId ?? null,
      });
      const query =
        typeof input.name === "string"
          ? input.name
          : typeof input.productId === "string"
            ? input.productId
            : "";
      const result = await menuService.searchItems(
        menuSearchSchema.parse({ query, pageSize: 5, page: 1 }),
        menuContext,
      );
      if (result.records.length === 0) {
        return { error: "I don't have that information available right now." };
      }
      return {
        items: result.records.map((record) => ({
          id: record.item.id,
          name: record.item.name,
          available: record.availability.isAvailable,
        })),
      };
    },
  },
];
