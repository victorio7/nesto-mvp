import { after, NextResponse } from "next/server";
import {
  DEMO_AGENT_USER_ID,
  DEMO_AGENCY_COOKIE,
  DEMO_SESSION_COOKIE,
  NESTO_AGENCY_COOKIE,
  NESTO_AGENT_USER_COOKIE
} from "@/lib/auth/session";
import { getWelcomeEmail, sendEmail } from "@/lib/email/send-email";
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
    const existingAccount = await findExistingSignupAccount(supabase, parsed.value.email, parsed.value.phone);
    if (!existingAccount.ok) {
      return NextResponse.json(
        { error: "Une erreur est survenue. Contactez l’équipe Nesto si le problème continue." },
        { status: 500 }
      );
    }
    if (existingAccount.exists) {
      const error = existingAccount.reason === "phone"
        ? "Ce numéro WhatsApp est déjà utilisé. Connectez-vous ou contactez l’équipe Nesto."
        : "Ce compte existe déjà. Connectez-vous.";
      return NextResponse.json({ error }, { status: 409 });
    }

    const agency = await findOrCreateAgency(supabase, {
      agencyName: parsed.value.agencyName,
      websiteUrl: parsed.value.websiteUrl
    });

    if (!agency.ok) {
      logSignupError("agency_create", agency.error);
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
      logSignupError("agent_create", agentUser.error);
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
      logSignupError("profile_create", profile.error);
      return NextResponse.json({ error: "Impossible de préparer le profil agent." }, { status: 500 });
    }

    // Optional MVP defaults must never block account creation.
    await ensureAutonomySettings(supabase, agencyId);

    const trial = await ensureSimulatedTrial(supabase, agencyId);
    if (!trial.ok) {
      logSignupError("trial_create", trial.error);
      return NextResponse.json({ error: "Impossible d'activer le mois gratuit." }, { status: 500 });
    }
  }

  const response = NextResponse.json({
    ok: true,
    success: true,
    redirectTo: "/installation?trial=active",
    agency_id: agencyId,
    agent_user_id: agentUserId,
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

  after(async () => {
    const welcomeEmail = getWelcomeEmail(firstNameFrom(parsed.value.fullName));
    await sendEmail({
      to: parsed.value.email,
      ...welcomeEmail
    });
  });

  return response;
}

type SupabaseAdmin = NonNullable<ReturnType<typeof createSupabaseAdminClientOrNull>>;

async function findExistingSignupAccount(supabase: SupabaseAdmin, email: string, phone: string) {
  const agencyUser = await supabase
    .from("agency_users")
    .select("id")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (agencyUser.error) {
    logSignupError("existing_agency_user_lookup", agencyUser.error);
    return { ok: false as const, exists: false };
  }
  if (agencyUser.data?.id) return { ok: true as const, exists: true, reason: "email" as const };

  const profile = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (profile.error) {
    logSignupError("existing_profile_lookup", profile.error);
    return { ok: false as const, exists: false };
  }

  if (profile.data?.id) return { ok: true as const, exists: true, reason: "email" as const };

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return { ok: true as const, exists: false };

  const [agencyPhones, profilePhones] = await Promise.all([
    supabase.from("agency_users").select("id, phone").not("phone", "is", null),
    supabase.from("profiles").select("id, phone").not("phone", "is", null)
  ]);

  if (agencyPhones.error) {
    logSignupError("existing_agency_user_phone_lookup", agencyPhones.error);
    return { ok: false as const, exists: false };
  }
  if (profilePhones.error) {
    logSignupError("existing_profile_phone_lookup", profilePhones.error);
    return { ok: false as const, exists: false };
  }

  const phoneExists = [...(agencyPhones.data ?? []), ...(profilePhones.data ?? [])]
    .some((row) => normalizePhone(row.phone) === normalizedPhone);

  return phoneExists
    ? { ok: true as const, exists: true, reason: "phone" as const }
    : { ok: true as const, exists: false };
}

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

  if (byWebsite.error) return { ok: false as const, error: byWebsite.error };
  if (byWebsite.data?.id) return { ok: true as const, agencyId: byWebsite.data.id as string };

  const byName = await supabase.from("agencies").select("id, website_url").eq("name", input.agencyName).limit(1).maybeSingle();
  if (byName.error) return { ok: false as const, error: byName.error };

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

  if (error || !data?.id) return { ok: false as const, error: error ?? "Agence créée sans id." };
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

  if (byEmail.error) return { ok: false as const, error: byEmail.error };
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

    if (byPhone.error) return { ok: false as const, error: byPhone.error };
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

  if (error || !data?.id) return { ok: false as const, error: error ?? "Agent créé sans id." };
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

  if (existing.error) return { ok: false, error: existing.error };

  if (existing.data?.id) {
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: existing.data.full_name || input.fullName,
        phone: existing.data.phone || input.phone || null,
        role: "owner"
      })
      .eq("id", existing.data.id);
    return { ok: !error, error };
  }

  const { error } = await supabase.from("profiles").insert({
    agency_id: input.agencyId,
    full_name: input.fullName,
    email: input.email,
    phone: input.phone || null,
    role: "owner"
  });
  return { ok: !error, error };
}

async function ensureAutonomySettings(supabase: SupabaseAdmin, agencyId: string) {
  const existing = await supabase
    .from("agency_autonomy_settings")
    .select("id")
    .eq("agency_id", agencyId)
    .limit(1)
    .maybeSingle();

  if (existing.error) return { ok: false, error: existing.error };
  if (existing.data?.id) return { ok: true };

  const { error } = await supabase.from("agency_autonomy_settings").insert({ agency_id: agencyId });
  return { ok: !error, error };
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
  return { ok: !error, error };
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function firstNameFrom(fullName: string) {
  return fullName.split(/\s+/).filter(Boolean)[0] || "bonjour";
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function logSignupError(step: string, error: unknown) {
  console.error("Erreur signup Nesto", {
    step,
    error: getErrorMessage(error)
  });
}

function getErrorMessage(error: unknown) {
  if (!error) return "Erreur inconnue";
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message);
  }
  return String(error);
}
