import { NextResponse } from "next/server";
import {
  DEMO_AGENT_USER_ID,
  DEMO_AGENCY_COOKIE,
  DEMO_SESSION_COOKIE,
  NESTO_AGENCY_COOKIE,
  NESTO_AGENT_USER_COOKIE
} from "@/lib/auth/session";
import { validateSignupInput } from "@/lib/security/validation";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = validateSignupInput(body);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = createSupabaseAdminClientOrNull();
  let agencyId = "agency-demo";
  let agentUserId = DEMO_AGENT_USER_ID;

  if (supabase) {
    const agency = await findOrCreateAgency(supabase, {
      agencyName: parsed.value.agencyName,
      websiteUrl: parsed.value.websiteUrl
    });

    if (!agency.ok) {
      return NextResponse.json({ error: "Impossible de creer l'agence." }, { status: 500 });
    }

    agencyId = agency.agencyId;

    const agentUser = await findOrCreateAgentUser(supabase, {
      agencyId,
      fullName: parsed.value.fullName,
      email: parsed.value.email,
      phone: parsed.value.phone
    });

    if (!agentUser.ok) {
      return NextResponse.json({ error: "Impossible de creer l'espace agent." }, { status: 500 });
    }

    agentUserId = agentUser.agentUserId;

    const profile = await upsertProfile(supabase, {
      agencyId,
      fullName: parsed.value.fullName,
      email: parsed.value.email,
      phone: parsed.value.phone
    });

    if (!profile.ok) {
      return NextResponse.json({ error: "Impossible de préparer le profil agent." }, { status: 500 });
    }

    // Optional MVP defaults must never block account creation.
    await ensureAutonomySettings(supabase, agencyId);

    const trial = await ensureSimulatedTrial(supabase, agencyId);
    if (!trial.ok) {
      return NextResponse.json({ error: "Impossible d'activer le mois gratuit." }, { status: 500 });
    }
  }

  const response = NextResponse.json({
    ok: true,
    success: true,
    redirectTo: "/installation?trial=active",
    agency_id: agencyId,
    subscription_status: "simulated",
    trial_ends_at: addMonths(new Date(), 1).toISOString()
  });

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  };

  response.cookies.set(DEMO_SESSION_COOKIE, "active", cookieOptions);
  response.cookies.set(DEMO_AGENCY_COOKIE, agencyId, cookieOptions);
  response.cookies.set(NESTO_AGENCY_COOKIE, agencyId, cookieOptions);
  if (agentUserId) response.cookies.set(NESTO_AGENT_USER_COOKIE, agentUserId, cookieOptions);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

type SupabaseAdmin = NonNullable<ReturnType<typeof createSupabaseAdminClientOrNull>>;

async function findOrCreateAgency(
  supabase: SupabaseAdmin,
  input: {
    agencyName: string;
    websiteUrl: string;
  }
) {
  const byWebsite = input.websiteUrl
    ? await supabase.from("agencies").select("id, website_url").eq("website_url", input.websiteUrl).limit(1).maybeSingle()
    : { data: null, error: null };

  if (byWebsite.error) return { ok: false as const };
  if (byWebsite.data?.id) return { ok: true as const, agencyId: byWebsite.data.id as string };

  const byName = await supabase.from("agencies").select("id, website_url").eq("name", input.agencyName).limit(1).maybeSingle();
  if (byName.error) return { ok: false as const };

  if (byName.data?.id) {
    if (input.websiteUrl && !byName.data.website_url) {
      await supabase.from("agencies").update({ website_url: input.websiteUrl }).eq("id", byName.data.id);
    }
    return { ok: true as const, agencyId: byName.data.id as string };
  }

  const { data, error } = await supabase
    .from("agencies")
    .insert({
      name: input.agencyName,
      website_url: input.websiteUrl || null
    })
    .select("id")
    .single();

  if (error || !data?.id) return { ok: false as const };
  return { ok: true as const, agencyId: data.id as string };
}

async function findOrCreateAgentUser(
  supabase: SupabaseAdmin,
  input: {
    agencyId: string;
    fullName: string;
    email: string;
    phone: string;
  }
) {
  const byEmail = await supabase
    .from("agency_users")
    .select("id, full_name, phone")
    .eq("agency_id", input.agencyId)
    .eq("email", input.email)
    .limit(1)
    .maybeSingle();

  if (byEmail.error) return { ok: false as const };
  if (byEmail.data?.id) {
    await supabase
      .from("agency_users")
      .update({
        full_name: byEmail.data.full_name || input.fullName,
        phone: byEmail.data.phone || input.phone || null,
        role: "owner"
      })
      .eq("id", byEmail.data.id);
    return { ok: true as const, agentUserId: byEmail.data.id as string };
  }

  if (input.phone) {
    const byPhone = await supabase
      .from("agency_users")
      .select("id, full_name, email")
      .eq("agency_id", input.agencyId)
      .eq("phone", input.phone)
      .limit(1)
      .maybeSingle();

    if (byPhone.error) return { ok: false as const };
    if (byPhone.data?.id) {
      await supabase
        .from("agency_users")
        .update({
          full_name: byPhone.data.full_name || input.fullName,
          email: byPhone.data.email || input.email,
          role: "owner"
        })
        .eq("id", byPhone.data.id);
      return { ok: true as const, agentUserId: byPhone.data.id as string };
    }
  }

  const { data, error } = await supabase
    .from("agency_users")
    .insert({
      agency_id: input.agencyId,
      full_name: input.fullName,
      email: input.email,
      phone: input.phone || null,
      role: "owner"
    })
    .select("id")
    .single();

  if (error || !data?.id) return { ok: false as const };
  return { ok: true as const, agentUserId: data.id as string };
}

async function upsertProfile(
  supabase: SupabaseAdmin,
  input: {
    agencyId: string;
    fullName: string;
    email: string;
    phone: string;
  }
) {
  const existing = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .eq("agency_id", input.agencyId)
    .eq("email", input.email)
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) {
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: existing.data.full_name || input.fullName,
        phone: existing.data.phone || input.phone || null,
        role: "owner"
      })
      .eq("id", existing.data.id);
    return { ok: !error };
  }

  const { error } = await supabase.from("profiles").insert({
    agency_id: input.agencyId,
    full_name: input.fullName,
    email: input.email,
    phone: input.phone || null,
    role: "owner"
  });
  return { ok: !error };
}

async function ensureAutonomySettings(supabase: SupabaseAdmin, agencyId: string) {
  const existing = await supabase
    .from("agency_autonomy_settings")
    .select("id")
    .eq("agency_id", agencyId)
    .limit(1)
    .maybeSingle();

  if (existing.error) return { ok: false };
  if (existing.data?.id) return { ok: true };

  const { error } = await supabase.from("agency_autonomy_settings").insert({ agency_id: agencyId });
  return { ok: !error };
}

async function ensureSimulatedTrial(supabase: SupabaseAdmin, agencyId: string) {
  const { error } = await supabase.from("agency_subscriptions").upsert(
    {
      agency_id: agencyId,
      plan_name: "Nesto Assistant Immobilier",
      monthly_price: 99,
      commitment_months: 0,
      status: "simulated",
      current_period_start: new Date().toISOString(),
      current_period_end: addMonths(new Date(), 1).toISOString(),
      updated_at: new Date().toISOString()
    },
    { onConflict: "agency_id" }
  );
  return { ok: !error };
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}
