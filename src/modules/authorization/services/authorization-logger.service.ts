import type { AuthorizationLogEntry } from "@/modules/authorization/types/authorization";

export function logAuthorizationDecision(entry: AuthorizationLogEntry): void {
  console.info("[authorization]", JSON.stringify(entry));
}
