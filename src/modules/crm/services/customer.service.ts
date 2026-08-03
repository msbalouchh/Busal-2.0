import { customerRepository } from "@/modules/crm/repository/customer-repository";
import type {
  CreateCustomerInput,
  CrmPlatformContext,
  CustomerRecord,
  CustomerSearchQuery,
  UpdateCustomerInput,
} from "@/modules/crm/types/customer";

export class CustomerService {
  search(query: CustomerSearchQuery, context?: CrmPlatformContext): CustomerRecord[] {
    return customerRepository.search({
      ...query,
      tenantId: query.tenantId ?? context?.tenantId,
      businessId: query.businessId ?? context?.businessId,
      branchId: query.branchId ?? context?.branchId ?? undefined,
    });
  }

  getById(customerId: string): CustomerRecord | undefined {
    return customerRepository.findById(customerId);
  }

  create(input: CreateCustomerInput): CustomerRecord {
    return customerRepository.create(input);
  }

  update(input: UpdateCustomerInput): CustomerRecord | undefined {
    return customerRepository.update(input);
  }

  getTimeline(customerId: string) {
    return customerRepository.findById(customerId)?.timeline ?? [];
  }

  getCommunications(customerId: string) {
    return customerRepository.findById(customerId)?.communications ?? [];
  }

  getAnalytics(customerId: string) {
    return customerRepository.findById(customerId)?.analytics ?? null;
  }

  getAiContext(customerId: string) {
    return customerRepository.findById(customerId)?.aiContext ?? null;
  }
}

export const customerService = new CustomerService();
