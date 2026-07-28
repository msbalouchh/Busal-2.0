import { registerIdentityProvider } from "@/modules/iam/registry/iam-registry";

const PROVIDERS = [
  {
    providerType: "EMAIL_PASSWORD" as const,
    name: "Email & Password",
    description: "Standard email and password authentication.",
  },
  {
    providerType: "MAGIC_LINK" as const,
    name: "Magic Link",
    description: "Passwordless email magic link sign-in.",
  },
  {
    providerType: "PASSKEY" as const,
    name: "Passkeys",
    description: "WebAuthn passkey authentication.",
  },
  {
    providerType: "OAUTH2" as const,
    name: "OAuth 2.0",
    description: "OAuth 2.0 delegated authentication.",
  },
  {
    providerType: "OIDC" as const,
    name: "OpenID Connect",
    description: "OIDC identity federation.",
  },
  {
    providerType: "SAML" as const,
    name: "SAML 2.0",
    description: "Enterprise SAML single sign-on.",
  },
] as const;

const OAUTH_READY = [
  {
    providerType: "OAUTH2" as const,
    name: "Google",
    description: "Google OAuth",
    oauthProvider: "google",
  },
  {
    providerType: "OAUTH2" as const,
    name: "Microsoft",
    description: "Microsoft OAuth",
    oauthProvider: "microsoft",
  },
  {
    providerType: "OAUTH2" as const,
    name: "Apple",
    description: "Apple OAuth",
    oauthProvider: "apple",
  },
  {
    providerType: "OAUTH2" as const,
    name: "GitHub",
    description: "GitHub OAuth",
    oauthProvider: "github",
  },
  {
    providerType: "OAUTH2" as const,
    name: "LinkedIn",
    description: "LinkedIn OAuth",
    oauthProvider: "linkedin",
  },
] as const;

export function registerBootstrapIamProviders(): void {
  for (const provider of PROVIDERS) {
    registerIdentityProvider(provider);
  }

  for (const provider of OAUTH_READY) {
    registerIdentityProvider(provider);
  }
}

let bootstrapComplete = false;

export function ensureBootstrapIamProviders(): void {
  if (bootstrapComplete) {
    return;
  }

  registerBootstrapIamProviders();
  bootstrapComplete = true;
}

export { PROVIDERS as DEFAULT_IAM_PROVIDERS, OAUTH_READY as FUTURE_OAUTH_PROVIDERS };
