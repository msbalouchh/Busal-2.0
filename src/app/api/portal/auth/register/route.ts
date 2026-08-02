import { authError, authSuccess, handleAuthRouteError } from "@/modules/auth/lib/api-response";
import { CUSTOMER_PORTAL_ROUTES } from "@/modules/customer-portal/constants/routes";
import { setCustomerPortalBusinessCookie } from "@/modules/customer-portal/services/customer-portal-session.service";
import {
  CustomerPortalError,
  registerCustomerPortalAccount,
} from "@/services/customer-portal.service";
import { z } from "zod";

const portalRegisterSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  businessCode: z.string().min(2),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = portalRegisterSchema.safeParse(body);

    if (!parsed.success) {
      return authError(parsed.error.errors[0]?.message ?? "Invalid request body", 422);
    }

    const result = await registerCustomerPortalAccount(parsed.data);
    await setCustomerPortalBusinessCookie(result.businessId);

    return authSuccess(
      {
        user: result.session.user,
        redirectPath: CUSTOMER_PORTAL_ROUTES.dashboard,
      },
      201,
    );
  } catch (error) {
    if (error instanceof CustomerPortalError) {
      return authError(error.message, 400);
    }
    return handleAuthRouteError(error);
  }
}
