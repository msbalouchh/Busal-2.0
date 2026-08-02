import { authError, authSuccess, handleAuthRouteError } from "@/modules/auth/lib/api-response";
import { CUSTOMER_PORTAL_ROUTES } from "@/modules/customer-portal/constants/routes";
import { setCustomerPortalBusinessCookie } from "@/modules/customer-portal/services/customer-portal-session.service";
import {
  CustomerPortalError,
  loginCustomerPortalAccount,
} from "@/services/customer-portal.service";
import { z } from "zod";

const portalLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  redirectTo: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = portalLoginSchema.safeParse(body);

    if (!parsed.success) {
      return authError(parsed.error.errors[0]?.message ?? "Invalid request body", 422);
    }

    const result = await loginCustomerPortalAccount(parsed.data.email, parsed.data.password);

    if (result.businessId) {
      await setCustomerPortalBusinessCookie(result.businessId);
    }

    return authSuccess({
      user: result.session.user,
      redirectPath: parsed.data.redirectTo ?? CUSTOMER_PORTAL_ROUTES.dashboard,
    });
  } catch (error) {
    if (error instanceof CustomerPortalError) {
      return authError(error.message, 400);
    }
    return handleAuthRouteError(error);
  }
}
