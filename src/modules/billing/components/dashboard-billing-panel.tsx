"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  formatCommercialPlanPrice,
  listPublicCommercialPlans,
} from "@/modules/billing/lib/commercial-plan-display";
import {
  BUSAL_COMMERCIAL_PLAN_SLUGS,
  getSubscriptionPlanBySlug,
} from "@/modules/control-center/billing/registry/subscription-plan-registry";

interface BillingApiRecord {
  plan?: {
    id?: string;
    name?: string;
    slug?: string;
  };
  subscription?: {
    planId?: string;
    status?: string;
    trialEnd?: string | null;
    currentPeriodEnd?: string | null;
  };
}

const CHECKOUT_PLANS = listPublicCommercialPlans().filter((plan) => !plan.customPricing);

const DEFAULT_PLAN_ID =
  getSubscriptionPlanBySlug(BUSAL_COMMERCIAL_PLAN_SLUGS.CORE)?.id ?? CHECKOUT_PLANS[0]?.id ?? "";

export function DashboardBillingPanel() {
  const searchParams = useSearchParams();
  const billingRequired = searchParams.get("billing") === "required";
  const [record, setRecord] = useState<BillingApiRecord | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState(DEFAULT_PLAN_ID);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void fetch("/api/billing")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load billing details");
        }
        const body = (await response.json()) as { data?: { record?: BillingApiRecord } };
        const loadedRecord = body.data?.record ?? null;
        setRecord(loadedRecord);

        const currentPlanId = loadedRecord?.subscription?.planId ?? loadedRecord?.plan?.id;
        if (currentPlanId && CHECKOUT_PLANS.some((plan) => plan.id === currentPlanId)) {
          setSelectedPlanId(currentPlanId);
        }
      })
      .catch((fetchError: unknown) => {
        setError(fetchError instanceof Error ? fetchError.message : "Unable to load billing details");
      });
  }, []);

  const selectedPlan = useMemo(
    () => CHECKOUT_PLANS.find((plan) => plan.id === selectedPlanId) ?? null,
    [selectedPlanId],
  );

  function runBillingAction(action: "checkout" | "portal") {
    startTransition(async () => {
      setError(null);

      if (action === "checkout" && !selectedPlanId) {
        setError("Select a plan to continue.");
        return;
      }

      const response = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "checkout"
            ? { action, planId: selectedPlanId, billingCycle: "monthly" }
            : { action },
        ),
      });
      const body = (await response.json()) as {
        success?: boolean;
        data?: { url?: string };
        error?: string;
      };

      if (!response.ok || !body.success || !body.data?.url) {
        setError(body.error ?? "Billing action failed");
        return;
      }

      window.location.assign(body.data.url);
    });
  }

  const subscription = record?.subscription;
  const plan = record?.plan;
  const status = subscription?.status ?? "unknown";

  return (
    <div className="space-y-6">
      {billingRequired ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base">Subscription required</CardTitle>
            <CardDescription>
              Activate billing to continue using Busal. Start checkout or manage your subscription
              below.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Billing & subscription</CardTitle>
          <CardDescription>Manage your Busal plan, trial, and payment method.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">{status}</Badge>
            {plan?.name ? <span className="text-sm font-medium">{plan.name}</span> : null}
          </div>

          {subscription?.trialEnd ? (
            <p className="text-muted-foreground text-sm">
              Trial ends {new Date(subscription.trialEnd).toLocaleDateString()}
            </p>
          ) : null}

          {subscription?.currentPeriodEnd ? (
            <p className="text-muted-foreground text-sm">
              Current period ends {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="billing-plan">Plan for checkout</Label>
            <select
              id="billing-plan"
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full max-w-md rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              value={selectedPlanId}
              onChange={(event) => setSelectedPlanId(event.target.value)}
              disabled={isPending}
            >
              {CHECKOUT_PLANS.map((checkoutPlan) => (
                <option key={checkoutPlan.id} value={checkoutPlan.id}>
                  {checkoutPlan.name} — {formatCommercialPlanPrice(checkoutPlan)}
                </option>
              ))}
            </select>
            {selectedPlan ? (
              <p className="text-muted-foreground text-xs">{selectedPlan.description}</p>
            ) : null}
          </div>

          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button disabled={isPending || !selectedPlanId} onClick={() => runBillingAction("checkout")}>
              Start or change plan
            </Button>
            <Button disabled={isPending} variant="outline" onClick={() => runBillingAction("portal")}>
              Manage billing in Stripe
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
