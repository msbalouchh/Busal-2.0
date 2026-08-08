import "server-only";

/** True when running a production deployment. */
export function isProductionDeployment(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Mock/stub fallbacks are only permitted outside production or when explicitly enabled. */
export function isMockFallbackAllowed(): boolean {
  if (process.env.ALLOW_MOCK_AI === "true") {
    return true;
  }
  return !isProductionDeployment();
}

/** Cron endpoints require a secret in production. */
export function isCronAuthorizedWithoutSecret(): boolean {
  return !isProductionDeployment();
}

/** Stripe webhooks require verification in production. */
export function isStripeWebhookBypassAllowed(): boolean {
  return !isProductionDeployment();
}
