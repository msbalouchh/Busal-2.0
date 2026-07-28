import type { UserRole } from "@/constants/roles";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  tenantId: string | null;
}

export interface Session {
  user: AuthUser;
  accessToken: string;
}

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  industry: string;
}
