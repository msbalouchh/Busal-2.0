"use client";

import { Loader2, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  initiateCustomDomainVerificationAction,
  updatePlatformApiSettingsAction,
  updatePlatformBrandingSettingsAction,
  updatePlatformDomainSettingsAction,
  updatePlatformEmbedSettingsAction,
  updatePlatformWebhookSettingsAction,
  verifyCustomDomainAction,
} from "@/modules/platform/actions/platform-config-actions";
import type {
  PlatformConsumptionConfig,
  PlatformEntitlements,
} from "@/modules/platform/types/platform-config.types";

interface WhiteLabelSettingsFormProps {
  config: PlatformConsumptionConfig;
  entitlements: PlatformEntitlements;
}

export function WhiteLabelSettingsForm({ config, entitlements }: WhiteLabelSettingsFormProps) {
  const [branding, setBranding] = useState(config.branding);
  const [domains, setDomains] = useState(config.domains);
  const [apiEnabled, setApiEnabled] = useState(config.api.enabled);
  const [webhooksEnabled, setWebhooksEnabled] = useState(config.webhooks.enabled);
  const [embedEnabled, setEmbedEnabled] = useState(config.embed.enabled);
  const [verificationInfo, setVerificationInfo] = useState<{
    dnsHost: string;
    dnsValue: string;
    httpUrl: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const saveBranding = () => {
    startTransition(async () => {
      try {
        await updatePlatformBrandingSettingsAction({
          platformName: branding.platformName,
          logoUrl: branding.logoUrl,
          faviconUrl: branding.faviconUrl,
          primaryColor: branding.primaryColor,
          secondaryColor: branding.secondaryColor,
          accentColor: branding.accentColor,
          showBusalBranding: branding.showBusalBranding,
          customerFacingBrandName: branding.customerFacingBrandName,
          emailBrandName: branding.emailBrandName,
          emailLogoUrl: branding.emailLogoUrl,
        });
        toast.success("Branding settings saved");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save branding");
      }
    });
  };

  const saveDomains = () => {
    startTransition(async () => {
      try {
        await updatePlatformDomainSettingsAction({
          subdomain: domains.subdomain,
          customDomain: domains.customDomain,
          allowedOrigins: domains.allowedOrigins,
        });
        toast.success("Domain settings saved");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save domains");
      }
    });
  };

  const initiateVerification = () => {
    if (!domains.customDomain) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await initiateCustomDomainVerificationAction(domains.customDomain!);
        setVerificationInfo({
          dnsHost: result.dnsHost,
          dnsValue: result.dnsValue,
          httpUrl: result.httpUrl,
        });
        setDomains((current) => ({
          ...current,
          customDomainVerificationStatus: "pending",
        }));
        toast.success("Verification instructions generated");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to start verification");
      }
    });
  };

  const verifyDomain = () => {
    startTransition(async () => {
      try {
        const result = await verifyCustomDomainAction();
        if (result.verified) {
          setDomains((current) => ({
            ...current,
            customDomainVerificationStatus: "verified",
          }));
          toast.success(`Custom domain verified via ${result.method ?? "DNS/HTTP"}`);
        } else {
          setDomains((current) => ({
            ...current,
            customDomainVerificationStatus: "failed",
          }));
          toast.error("Domain verification failed. Check DNS or HTTP file and try again.");
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Domain verification failed");
      }
    });
  };

  const saveWebhooks = () => {
    startTransition(async () => {
      try {
        await updatePlatformWebhookSettingsAction({ enabled: webhooksEnabled });
        toast.success("Webhook settings saved");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save webhook settings");
      }
    });
  };

  const saveEmbed = () => {
    startTransition(async () => {
      try {
        await updatePlatformEmbedSettingsAction({
          enabled: embedEnabled,
          allowedOrigins: config.embed.allowedOrigins,
        });
        toast.success("Embed settings saved");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save embed settings");
      }
    });
  };

  const saveApi = () => {
    startTransition(async () => {
      try {
        await updatePlatformApiSettingsAction({ enabled: apiEnabled });
        toast.success("API settings saved");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save API settings");
      }
    });
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Platform Branding</h2>
          <p className="text-muted-foreground text-sm">
            Configure how your platform appears to customers and staff.
          </p>
        </div>

        {!entitlements.whiteLabel ? (
          <p className="text-muted-foreground text-sm">
            White-label branding requires Busal Growth or higher.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="platformName">Platform name</Label>
              <Input
                id="platformName"
                value={branding.platformName}
                onChange={(event) =>
                  setBranding((current) => ({ ...current, platformName: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerBrand">Customer-facing brand</Label>
              <Input
                id="customerBrand"
                value={branding.customerFacingBrandName ?? ""}
                onChange={(event) =>
                  setBranding((current) => ({
                    ...current,
                    customerFacingBrandName: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={branding.logoUrl ?? ""}
                onChange={(event) =>
                  setBranding((current) => ({ ...current, logoUrl: event.target.value || null }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faviconUrl">Favicon URL</Label>
              <Input
                id="faviconUrl"
                value={branding.faviconUrl ?? ""}
                onChange={(event) =>
                  setBranding((current) => ({
                    ...current,
                    faviconUrl: event.target.value || null,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary color</Label>
              <Input
                id="primaryColor"
                type="color"
                value={branding.primaryColor}
                onChange={(event) =>
                  setBranding((current) => ({ ...current, primaryColor: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary color</Label>
              <Input
                id="secondaryColor"
                type="color"
                value={branding.secondaryColor}
                onChange={(event) =>
                  setBranding((current) => ({ ...current, secondaryColor: event.target.value }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4 md:col-span-2">
              <div>
                <p className="font-medium">Show Busal branding</p>
                <p className="text-muted-foreground text-sm">
                  Display &quot;Powered by Busal&quot; where applicable.
                </p>
              </div>
              <Switch
                checked={branding.showBusalBranding}
                onChange={(event) =>
                  setBranding((current) => ({
                    ...current,
                    showBusalBranding: event.target.checked,
                  }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <Button onClick={saveBranding} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save branding
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Domains</h2>
          <p className="text-muted-foreground text-sm">
            Configure tenant subdomain and custom domain routing.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomain slug</Label>
            <Input
              id="subdomain"
              placeholder="restaurant"
              value={domains.subdomain ?? ""}
              disabled={!entitlements.whiteLabel}
              onChange={(event) =>
                setDomains((current) => ({
                  ...current,
                  subdomain: event.target.value || null,
                }))
              }
            />
            <p className="text-muted-foreground text-xs">
              {domains.subdomain
                ? `${domains.subdomain}.getbusal.com`
                : "your-brand.getbusal.com"}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customDomain">Custom domain</Label>
            <Input
              id="customDomain"
              placeholder="app.yourdomain.com"
              value={domains.customDomain ?? ""}
              disabled={!entitlements.customDomain}
              onChange={(event) =>
                setDomains((current) => ({
                  ...current,
                  customDomain: event.target.value || null,
                  customDomainVerificationStatus: "pending",
                }))
              }
            />
            <p className="text-muted-foreground text-xs">
              Status: {domains.customDomainVerificationStatus}
              {domains.customDomainVerifiedAt
                ? ` · verified ${new Date(domains.customDomainVerifiedAt).toLocaleDateString()}`
                : null}
            </p>
          </div>
          {domains.customDomain && entitlements.customDomain ? (
            <div className="rounded-lg border bg-muted/30 p-4 md:col-span-2">
              <p className="mb-2 text-sm font-medium">Domain verification</p>
              <p className="text-muted-foreground mb-3 text-xs">
                Add a DNS TXT record or host a verification file before checking. Domains are not
                active until verified.
              </p>
              {verificationInfo ? (
                <div className="text-muted-foreground mb-3 space-y-1 font-mono text-xs">
                  <p>DNS TXT host: {verificationInfo.dnsHost}</p>
                  <p>DNS TXT value: {verificationInfo.dnsValue}</p>
                  <p>HTTP file: {verificationInfo.httpUrl}</p>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button onClick={saveDomains} disabled={isPending || !entitlements.whiteLabel}>
              Save domains
            </Button>
            {domains.customDomain && entitlements.customDomain ? (
              <>
                <Button variant="outline" onClick={initiateVerification} disabled={isPending}>
                  Generate verification
                </Button>
                <Button variant="outline" onClick={verifyDomain} disabled={isPending}>
                  Check verification
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">API Platform</h2>
          <p className="text-muted-foreground text-sm">
            Enable programmatic access via /api/v1 with API keys from the Developer Portal.
          </p>
        </div>

        {!entitlements.apiAccess ? (
          <p className="text-muted-foreground text-sm">
            API access requires a plan with API gateway entitlement (Growth or higher).
          </p>
        ) : (
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Enable API access</p>
              <p className="text-muted-foreground text-sm">
                Authenticate with Bearer bk_… keys scoped to your tenant.
              </p>
            </div>
            <Switch checked={apiEnabled} onChange={(event) => setApiEnabled(event.target.checked)} />
          </div>
        )}

        {entitlements.apiAccess ? (
          <div className="mt-4">
            <Button onClick={saveApi} disabled={isPending}>
              Save API settings
            </Button>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Webhooks</h2>
          <p className="text-muted-foreground text-sm">
            Enable outbound webhook delivery for domain events.
          </p>
        </div>

        {!entitlements.webhooks ? (
          <p className="text-muted-foreground text-sm">
            Webhooks require Busal Pro or Enterprise.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Enable webhooks</p>
                <p className="text-muted-foreground text-sm">
                  Deliver signed events to configured endpoints.
                </p>
              </div>
              <Switch
                checked={webhooksEnabled}
                onChange={(event) => setWebhooksEnabled(event.target.checked)}
              />
            </div>
            <div className="mt-4">
              <Button onClick={saveWebhooks} disabled={isPending}>
                Save webhook settings
              </Button>
            </div>
          </>
        )}
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Embeds</h2>
          <p className="text-muted-foreground text-sm">
            Enable embeddable menu and booking widgets on external sites.
          </p>
        </div>

        {!entitlements.embed ? (
          <p className="text-muted-foreground text-sm">Embeds require Busal Enterprise.</p>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Enable embeds</p>
                <p className="text-muted-foreground text-sm">
                  Signed tokens with origin allowlist enforcement.
                </p>
              </div>
              <Switch
                checked={embedEnabled}
                onChange={(event) => setEmbedEnabled(event.target.checked)}
              />
            </div>
            <div className="mt-4">
              <Button onClick={saveEmbed} disabled={isPending}>
                Save embed settings
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
