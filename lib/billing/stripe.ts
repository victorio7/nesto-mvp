import Stripe from "stripe";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";
import { sanitizeEmail, sanitizeText } from "@/lib/security/validation";

export type CheckoutSessionResult = {
  mode: "stripe" | "simulated";
  url: string;
  plan_name: string;
  monthly_price: number;
  commitment_months: number;
};

type CheckoutInput = {
  agencyId?: string | null;
  email?: string | null;
  name?: string | null;
  origin?: string | null;
};

const plan = {
  plan_name: "Nesto Assistant Immobilier",
  monthly_price: 99,
  commitment_months: 0,
  trial_days: 30
};

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID_ASSISTANT_99);
}

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured.");
  return new Stripe(secretKey);
}

export async function createCheckoutSession(input: CheckoutInput = {}): Promise<CheckoutSessionResult> {
  const appUrl = getAppUrl(input.origin);
  const agencyId = sanitizeText(input.agencyId || "agency-demo", 120);
  const email = sanitizeEmail(input.email);
  const name = sanitizeText(input.name || "Agence Nesto", 160);

  if (!isStripeConfigured()) {
    await upsertSimulatedSubscription(agencyId);
    return {
      mode: "simulated",
      url: `${appUrl}/installation?payment=simulated`,
      ...plan
    };
  }

  const stripe = getStripeClient();
  const customerId = await findOrCreateStripeCustomer({
    stripe,
    agencyId,
    email: email || undefined,
    name
  });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID_ASSISTANT_99,
        quantity: 1
      }
    ],
    subscription_data: {
      trial_period_days: plan.trial_days,
      metadata: {
        agency_id: agencyId,
        plan_name: plan.plan_name,
        commitment_months: String(plan.commitment_months)
      }
    },
    metadata: {
      agency_id: agencyId,
      plan_name: plan.plan_name
    },
    allow_promotion_codes: false,
    success_url: `${appUrl}/installation?payment=success`,
    cancel_url: `${appUrl}/?payment=cancelled`
  });

  return {
    mode: "stripe",
    url: session.url ?? `${appUrl}/installation?payment=success`,
    ...plan
  };
}

async function findOrCreateStripeCustomer({
  stripe,
  agencyId,
  email,
  name
}: {
  stripe: Stripe;
  agencyId: string;
  email?: string;
  name: string;
}) {
  const supabase = createSupabaseAdminClientOrNull();

  if (supabase) {
    const { data } = await supabase
      .from("agency_subscriptions")
      .select("stripe_customer_id")
      .eq("agency_id", agencyId)
      .not("stripe_customer_id", "is", null)
      .maybeSingle();

    if (data?.stripe_customer_id) return data.stripe_customer_id as string;
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      agency_id: agencyId
    }
  });

  if (supabase) {
    await supabase.from("agency_subscriptions").upsert(
      {
        agency_id: agencyId,
        plan_name: plan.plan_name,
        monthly_price: plan.monthly_price,
        commitment_months: plan.commitment_months,
        status: "incomplete",
        stripe_customer_id: customer.id,
        stripe_price_id: process.env.STRIPE_PRICE_ID_ASSISTANT_99,
        updated_at: new Date().toISOString()
      },
      { onConflict: "agency_id" }
    );
  }

  return customer.id;
}

async function upsertSimulatedSubscription(agencyId: string) {
  const supabase = createSupabaseAdminClientOrNull();
  if (!supabase) return;

  await supabase.from("agency_subscriptions").upsert(
    {
      agency_id: agencyId,
      plan_name: plan.plan_name,
      monthly_price: plan.monthly_price,
      commitment_months: plan.commitment_months,
      status: "simulated",
      stripe_price_id: process.env.STRIPE_PRICE_ID_ASSISTANT_99 ?? null,
      current_period_start: new Date().toISOString(),
      current_period_end: addMonths(new Date(), 1).toISOString(),
      updated_at: new Date().toISOString()
    },
    { onConflict: "agency_id" }
  );
}

export function getAppUrl(origin?: string | null) {
  return process.env.NEXT_PUBLIC_APP_URL || origin || "http://localhost:3000";
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}
