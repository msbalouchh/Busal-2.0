import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { isStripeWebhookBypassAllowed } from "@/lib/production-mode";
import { getStripeClient, getStripeWebhookSecret, isStripeConfigured } from "@/lib/stripe";
import {
  hasProcessedStripeEvent,
  markStripeEventProcessed,
  stripeBillingService,
} from "@/modules/commercial-foundation/services/stripe-billing.service";
import { DOMAIN_EVENT_TYPES } from "@/modules/platform-orchestration/constants/domain-events";
import { publishModuleDomainEvent } from "@/modules/platform-orchestration/lib/publish-module-event";

function resolveBusinessId(metadata: Stripe.Metadata | null | undefined): string | null {
  const businessId = metadata?.businessId;
  return typeof businessId === "string" ? businessId : null;
}

async function publishBillingEvent(
  businessId: string,
  eventType: string,
  aggregateId: string,
  payload: Record<string, unknown>,
) {
  await publishModuleDomainEvent(
    {
      tenantId: businessId,
      workspaceId: `${businessId}-ws`,
      businessId,
      branchId: null,
      userId: "stripe",
    },
    {
      eventType,
      aggregateId,
      payload,
    },
  );
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    if (!isStripeWebhookBypassAllowed()) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    }
    return NextResponse.json({ received: true, mode: "local" });
  }

  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, getStripeWebhookSecret());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const businessId =
    resolveBusinessId((event.data.object as { metadata?: Stripe.Metadata }).metadata) ??
    resolveBusinessId(
      event.type.startsWith("customer.subscription")
        ? (event.data.object as Stripe.Subscription).metadata
        : event.type.startsWith("checkout.session")
          ? (event.data.object as Stripe.Checkout.Session).metadata
          : (event.data.object as Stripe.Invoice).metadata,
    );

  if (businessId && (await hasProcessedStripeEvent(businessId, event.id))) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const resolvedBusinessId = resolveBusinessId(session.metadata);
      if (resolvedBusinessId && typeof session.subscription === "string") {
        await stripeBillingService.syncSubscriptionFromStripe(resolvedBusinessId, session.subscription);
        await publishBillingEvent(resolvedBusinessId, DOMAIN_EVENT_TYPES.SUBSCRIPTION_CREATED, session.subscription, {
          source: "stripe_checkout",
        });
        await markStripeEventProcessed(resolvedBusinessId, event.id);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription;
      const resolvedBusinessId = resolveBusinessId(subscription.metadata);
      if (resolvedBusinessId) {
        await stripeBillingService.syncSubscriptionFromStripe(resolvedBusinessId, subscription.id);
        await publishBillingEvent(resolvedBusinessId, DOMAIN_EVENT_TYPES.SUBSCRIPTION_UPDATED, subscription.id, {
          status: subscription.status,
        });
        await markStripeEventProcessed(resolvedBusinessId, event.id);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const resolvedBusinessId = resolveBusinessId(subscription.metadata);
      if (resolvedBusinessId) {
        await stripeBillingService.syncSubscriptionFromStripe(resolvedBusinessId, subscription.id);
        await publishBillingEvent(resolvedBusinessId, DOMAIN_EVENT_TYPES.SUBSCRIPTION_CANCELLED, subscription.id, {
          source: "stripe_webhook",
        });
        await markStripeEventProcessed(resolvedBusinessId, event.id);
      }
      break;
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const resolvedBusinessId = resolveBusinessId(invoice.metadata);
      if (resolvedBusinessId) {
        await stripeBillingService.recordInvoiceFromStripe(resolvedBusinessId, {
          id: invoice.id,
          number: invoice.number,
          status: invoice.status,
          amount_due: invoice.amount_due,
          amount_paid: invoice.amount_paid,
          currency: invoice.currency,
          period_start: invoice.period_start ?? Math.floor(Date.now() / 1000),
          period_end: invoice.period_end ?? Math.floor(Date.now() / 1000),
        });

        if (event.type === "invoice.payment_failed") {
          const paymentIntentId =
            typeof invoice.payments?.data?.[0]?.payment?.payment_intent === "string"
              ? invoice.payments.data[0].payment.payment_intent
              : invoice.id;
          await stripeBillingService.recordPaymentFailure(
            resolvedBusinessId,
            paymentIntentId,
            "Invoice payment failed",
          );
        }

        await markStripeEventProcessed(resolvedBusinessId, event.id);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
