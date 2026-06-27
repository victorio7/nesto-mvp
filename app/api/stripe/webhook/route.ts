import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/billing/stripe";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  try {
    await handleStripeEvent(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}

async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await upsertSubscriptionFromStripe(event.data.object as Stripe.Subscription);
      break;
    case "invoice.payment_succeeded":
      await updateSubscriptionPaymentStatus(event.data.object as Stripe.Invoice, "active");
      break;
    case "invoice.payment_failed":
      await updateSubscriptionPaymentStatus(event.data.object as Stripe.Invoice, "past_due");
      break;
    default:
      break;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const agencyId = session.metadata?.agency_id;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (!agencyId) return;

  const supabase = createSupabaseAdminClientOrNull();
  if (!supabase) return;

  await supabase.from("agency_subscriptions").upsert(
    {
      agency_id: agencyId,
      plan_name: "Clapy Assistant Immobilier",
      monthly_price: 99,
      commitment_months: 6,
      status: "active",
      stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: process.env.STRIPE_PRICE_ID_ASSISTANT_99 ?? null,
      updated_at: new Date().toISOString()
    },
    { onConflict: "agency_id" }
  );
}

async function upsertSubscriptionFromStripe(subscription: Stripe.Subscription) {
  const agencyId = subscription.metadata?.agency_id;
  if (!agencyId) return;

  const supabase = createSupabaseAdminClientOrNull();
  if (!supabase) return;

  const priceId = subscription.items.data[0]?.price.id ?? process.env.STRIPE_PRICE_ID_ASSISTANT_99 ?? null;
  const periodStart = getSubscriptionPeriod(subscription, "current_period_start");
  const periodEnd = getSubscriptionPeriod(subscription, "current_period_end");

  await supabase.from("agency_subscriptions").upsert(
    {
      agency_id: agencyId,
      plan_name: subscription.metadata?.plan_name || "Clapy Assistant Immobilier",
      monthly_price: 99,
      commitment_months: Number(subscription.metadata?.commitment_months ?? 6),
      status: normalizeStripeStatus(subscription.status),
      stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString()
    },
    { onConflict: "agency_id" }
  );
}

async function updateSubscriptionPaymentStatus(invoice: Stripe.Invoice, status: "active" | "past_due") {
  const invoiceWithSubscription = invoice as Stripe.Invoice & {
    subscription?: string | { id: string };
  };
  const subscriptionId =
    typeof invoiceWithSubscription.subscription === "string"
      ? invoiceWithSubscription.subscription
      : invoiceWithSubscription.subscription?.id;
  if (!subscriptionId) return;

  const supabase = createSupabaseAdminClientOrNull();
  if (!supabase) return;

  await supabase
    .from("agency_subscriptions")
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq("stripe_subscription_id", subscriptionId);
}

function getSubscriptionPeriod(subscription: Stripe.Subscription, key: "current_period_start" | "current_period_end") {
  const subscriptionWithPeriod = subscription as Stripe.Subscription & Record<typeof key, number | undefined>;
  return subscriptionWithPeriod[key] ?? subscription.items.data[0]?.[key] ?? null;
}

function normalizeStripeStatus(status: Stripe.Subscription.Status) {
  if (status === "active" || status === "trialing" || status === "past_due" || status === "canceled" || status === "incomplete") {
    return status;
  }
  return status === "unpaid" ? "past_due" : "incomplete";
}
