import {
  handleCreateCustomer,
  handleListCustomers,
} from "@/modules/crm/api/customers-route-handlers";

export const GET = handleListCustomers;
export const POST = handleCreateCustomer;
