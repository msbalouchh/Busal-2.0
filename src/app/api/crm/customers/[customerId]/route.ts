import {
  handleDeleteCustomer,
  handleGetCustomer,
  handleRestoreCustomer,
  handleUpdateCustomer,
} from "@/modules/crm/api/customers-route-handlers";

export async function GET(request: Request, context: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await context.params;
  return handleGetCustomer(request, customerId);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ customerId: string }> },
) {
  const { customerId } = await context.params;
  return handleUpdateCustomer(request, customerId);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ customerId: string }> },
) {
  const { customerId } = await context.params;
  return handleDeleteCustomer(request, customerId);
}

export async function POST(request: Request, context: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await context.params;
  const url = new URL(request.url);

  if (url.pathname.endsWith("/restore")) {
    return handleRestoreCustomer(request, customerId);
  }

  return handleUpdateCustomer(request, customerId);
}
