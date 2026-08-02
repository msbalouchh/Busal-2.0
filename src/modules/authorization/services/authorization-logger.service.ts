import type { AuthorizationLogEntry } from "@/modules/authorization/types/authorization";

export function logAuthorizationDecision(entry: AuthorizationLogEntry): void {
  if (process.env.NODE_ENV === "development") {
    console.info("[authorization]", JSON.stringify(entry));
  }
}
