import "server-only";

import type { CrmTenantScope } from "@/modules/crm/lib/crm-scope";
import {
  customerRepository,
  type CustomerExportRow,
  type CustomerImportResult,
  type CustomerSearchResult,
} from "@/modules/crm/repository/customer-repository";
import type {
  CreateCustomerInput,
  CrmPlatformContext,
  CustomerRecord,
  CustomerSearchQuery,
  PaginatedCustomerResult,
  UpdateCustomerInput,
} from "@/modules/crm/types/customer";

function resolveScope(context?: CrmPlatformContext): CrmTenantScope {
  if (!context?.businessId) {
    throw new Error("CRM business context is required");
  }

  return {
    tenantId: context.tenantId ?? context.businessId,
    workspaceId: context.workspaceId ?? context.businessId,
    businessId: context.businessId,
    branchId: context.branchId ?? null,
    userId: context.userId ?? "system",
  };
}

function mergeQuery(query: CustomerSearchQuery, context?: CrmPlatformContext): CustomerSearchQuery {
  return {
    ...query,
    tenantId: query.tenantId ?? context?.tenantId,
    businessId: query.businessId ?? context?.businessId,
    branchId: query.branchId ?? context?.branchId ?? undefined,
  };
}

export class CustomerService {
  async search(
    query: CustomerSearchQuery,
    context?: CrmPlatformContext,
  ): Promise<PaginatedCustomerResult> {
    const scope = resolveScope(context);
    const result: CustomerSearchResult = await customerRepository.search(
      scope,
      mergeQuery(query, context),
    );

    return {
      records: result.records,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  async searchRecords(
    query: CustomerSearchQuery,
    context?: CrmPlatformContext,
  ): Promise<CustomerRecord[]> {
    const result = await this.search(query, context);
    return result.records;
  }

  async getById(customerId: string, context?: CrmPlatformContext): Promise<CustomerRecord | null> {
    return customerRepository.findById(resolveScope(context), customerId);
  }

  async create(input: CreateCustomerInput, staffId: string | null = null): Promise<CustomerRecord> {
    const scope = resolveScope({
      tenantId: input.tenantId,
      workspaceId: input.workspaceId,
      businessId: input.businessId,
      branchId: input.branchId ?? null,
      userId: "system",
    });

    return customerRepository.create(scope, input, staffId);
  }

  async update(
    input: UpdateCustomerInput,
    context: CrmPlatformContext,
    staffId: string | null = null,
  ): Promise<CustomerRecord | null> {
    return customerRepository.update(resolveScope(context), input, staffId);
  }

  async softDelete(
    customerId: string,
    context: CrmPlatformContext,
    staffId: string | null = null,
  ): Promise<boolean> {
    return customerRepository.softDelete(resolveScope(context), customerId, staffId);
  }

  async restore(
    customerId: string,
    context: CrmPlatformContext,
    staffId: string | null = null,
  ): Promise<boolean> {
    return customerRepository.restore(resolveScope(context), customerId, staffId);
  }

  async merge(
    primaryCustomerId: string,
    secondaryCustomerId: string,
    context: CrmPlatformContext,
    staffId: string | null = null,
  ): Promise<CustomerRecord | null> {
    return customerRepository.mergeCustomers(
      resolveScope(context),
      primaryCustomerId,
      secondaryCustomerId,
      staffId,
    );
  }

  async addNote(
    customerId: string,
    content: string,
    context: CrmPlatformContext,
    staffId: string | null = null,
  ): Promise<void> {
    await customerRepository.addNote(resolveScope(context), customerId, content, staffId);
  }

  async exportCustomers(context: CrmPlatformContext): Promise<CustomerExportRow[]> {
    return customerRepository.exportCustomers(resolveScope(context));
  }

  async importCustomers(
    rows: Array<{
      name: string;
      email?: string | null;
      phone?: string | null;
      tags?: string;
      group?: string;
    }>,
    context: CrmPlatformContext,
    staffId: string | null = null,
  ): Promise<CustomerImportResult> {
    return customerRepository.importCustomers(resolveScope(context), rows, staffId);
  }

  async getTimeline(customerId: string, context?: CrmPlatformContext) {
    const record = await this.getById(customerId, context);
    return record?.timeline ?? [];
  }

  async getCommunications(customerId: string, context?: CrmPlatformContext) {
    const record = await this.getById(customerId, context);
    return record?.communications ?? [];
  }

  async getAnalytics(customerId: string, context?: CrmPlatformContext) {
    const record = await this.getById(customerId, context);
    return record?.analytics ?? null;
  }

  async getSegments(context: CrmPlatformContext) {
    return customerRepository.getSegments(resolveScope(context));
  }

  async getTags(context: CrmPlatformContext) {
    return customerRepository.getTags(resolveScope(context));
  }

  async getDashboard(context: CrmPlatformContext) {
    const scope = resolveScope(context);
    return customerRepository.getDashboard(scope, scope.branchId);
  }
}

export const customerService = new CustomerService();
