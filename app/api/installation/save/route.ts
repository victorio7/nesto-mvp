import { NextResponse } from "next/server";
import { getActiveAgentWorkspace } from "@/lib/agent-workspace";
import { sanitizeEmail, sanitizeText, validatePublicHttpUrl } from "@/lib/security/validation";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";

const stepKeys = new Set([
  "agency_info",
  "whatsapp_prospect",
  "whatsapp_agent",
  "agency_website",
  "professional_email",
  "social_sources",
  "extra_sources",
  "final_test"
]);

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const stepKey = sanitizeText((body as Record<string, unknown>).stepKey, 80);
  const action = sanitizeText((body as Record<string, unknown>).action, 40);
  const data = sanitizeInstallationData((body as Record<string, unknown>).data);

  if (!stepKeys.has(stepKey)) {
    return NextResponse.json({ ok: false, error: "Etape inconnue." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClientOrNull();
  if (!supabase) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      message: "Mode local : informations gardees pour la simulation."
    });
  }

  const workspace = await getActiveAgentWorkspace(supabase);
  if (!workspace) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      message: "Aucun espace agent trouve pour enregistrer l'installation."
    });
  }
  const agencyId = workspace.agencyId;

  const status = action === "help" ? "needs_help" : action === "test" ? "pending" : action === "skip" ? "skipped" : "completed";
  const errors: string[] = [];

  await collectError(errors, supabase.from("onboarding_steps").upsert(
    {
      agency_id: agencyId,
      step_key: stepKey,
      status,
      data,
      updated_at: new Date().toISOString()
    },
    { onConflict: "agency_id,step_key" }
  ));

  if (stepKey === "agency_info") {
    await collectError(errors, saveAgencyInfo(supabase, agencyId, data));
    await collectError(errors, saveAgentInfo(supabase, workspace.userId, data));
  }

  if (stepKey === "whatsapp_prospect") {
    await collectError(errors, saveIntegration(supabase, agencyId, "whatsapp_prospect", status, {
      phone_number: data.businessPhone
    }));
  }

  if (stepKey === "whatsapp_agent") {
    await collectError(errors, saveIntegration(supabase, agencyId, "whatsapp_agent", status, {
      phone_number: data.agentPhone,
      preference: data.alertPreference
    }));
    await collectError(errors, saveAgentNotificationChannel(supabase, agencyId, workspace.userId, data.agentPhone));
  }

  if (stepKey === "agency_website") {
    await collectError(errors, saveIntegration(supabase, agencyId, "agency_website", status, {
      website_url: data.websiteUrl,
      rental_url: data.rentalUrl,
      sale_url: data.saleUrl,
      sitemap_url: data.sitemapUrl,
      feed_url: data.feedUrl
    }));
    const sourceResults = await savePropertySources(supabase, agencyId, data, action);
    for (const result of sourceResults) {
      await collectError(errors, result);
    }
  }

  if (stepKey === "extra_sources") {
    if (data.email) await collectError(errors, saveIntegration(supabase, agencyId, "gmail", status, { email: data.email }));
    if (data.calendar) await collectError(errors, saveIntegration(supabase, agencyId, "google_calendar", status, { label: data.calendar }));
    if (data.social) {
      await collectError(errors, saveIntegration(supabase, agencyId, "messenger", status, { label: data.social }));
      await collectError(errors, saveIntegration(supabase, agencyId, "instagram", status, { label: data.social }));
      await collectError(errors, saveIntegration(supabase, agencyId, "facebook_page", status, { label: data.social }));
    }
  }

  if (stepKey === "professional_email") {
    if (data.email) await collectError(errors, saveIntegration(supabase, agencyId, "gmail", status, { email: data.email }));
  }

  if (stepKey === "social_sources") {
    if (data.facebookMessenger) {
      await collectError(errors, saveIntegration(supabase, agencyId, "messenger", status, { label: data.facebookMessenger }));
      await collectError(errors, saveIntegration(supabase, agencyId, "facebook_page", status, { label: data.facebookMessenger }));
    }
    if (data.instagram) await collectError(errors, saveIntegration(supabase, agencyId, "instagram", status, { label: data.instagram }));
  }

  return NextResponse.json({
    ok: errors.length === 0,
    persisted: errors.length === 0,
    message: errors.length ? "Informations partiellement enregistrees." : successMessageFor(stepKey),
    errors
  });
}

function sanitizeInstallationData(input: unknown) {
  const record = typeof input === "object" && input !== null ? input as Record<string, unknown> : {};
  const data: Record<string, string> = {};

  for (const [key, value] of Object.entries(record)) {
    if (key.toLowerCase().includes("email")) {
      data[key] = sanitizeEmail(value);
      continue;
    }

    if (key.toLowerCase().includes("url")) {
      const validated = validatePublicHttpUrl(value);
      data[key] = validated.ok ? validated.value : "";
      continue;
    }

    data[key] = sanitizeText(value, 500);
  }

  return data;
}

async function saveAgencyInfo(supabase: SupabaseAdmin, agencyId: string, data: Record<string, string>) {
  return supabase
    .from("agencies")
    .update({
      name: data.agencyName || "Votre agence",
      website_url: data.websiteUrl || undefined
    })
    .eq("id", agencyId);
}

async function saveAgentInfo(supabase: SupabaseAdmin, userId: string, data: Record<string, string>) {
  const fullName = data.agentName || data.fullName;
  if (!fullName && !data.email && !data.phone) return { error: null };
  const payload: Record<string, string> = {};
  if (fullName) payload.full_name = fullName;
  if (data.email) payload.email = data.email;
  if (data.phone) payload.phone = data.phone;

  return supabase
    .from("agency_users")
    .update(payload)
    .eq("id", userId);
}

async function saveIntegration(
  supabase: SupabaseAdmin,
  agencyId: string,
  integrationType: string,
  status: string,
  config: Record<string, string>
) {
  return supabase.from("integration_connections").upsert(
    {
      agency_id: agencyId,
      integration_type: integrationType,
      status: status === "completed" ? "connected" : status === "needs_help" ? "error" : "pending",
      config,
      updated_at: new Date().toISOString()
    },
    { onConflict: "agency_id,integration_type" }
  );
}

async function saveAgentNotificationChannel(supabase: SupabaseAdmin, agencyId: string, userId: string, phoneNumber: string) {
  if (!phoneNumber) return { error: null };

  const { data: existing, error: existingError } = await supabase
    .from("agent_notification_channels")
    .select("id")
    .eq("agency_id", agencyId)
    .eq("user_id", userId)
    .eq("channel_type", "whatsapp")
    .limit(1);

  if (existingError) return { error: existingError };
  const existingId = Array.isArray(existing) ? existing[0]?.id : null;

  if (existingId) {
    return supabase
      .from("agent_notification_channels")
      .update({ phone_number: phoneNumber, is_primary: true, status: "pending" })
      .eq("id", existingId);
  }

  return supabase.from("agent_notification_channels").insert({
    agency_id: agencyId,
    user_id: userId,
    channel_type: "whatsapp",
    phone_number: phoneNumber,
    is_primary: true,
    status: "pending"
  });
}

async function savePropertySources(
  supabase: SupabaseAdmin,
  agencyId: string,
  data: Record<string, string>,
  action: string
) {
  const status = action === "test" ? "connected" : "pending";
  const sources = [
    {
      key: "websiteUrl",
      name: "Site agence",
      source_type: "website"
    },
    {
      key: "rentalUrl",
      name: "Site agence - locations",
      source_type: "website"
    },
    {
      key: "saleUrl",
      name: "Site agence - ventes",
      source_type: "website"
    },
    {
      key: "sitemapUrl",
      name: "Sitemap annonces",
      source_type: "sitemap"
    },
    {
      key: "feedUrl",
      name: "Flux annonces",
      source_type: "xml_feed"
    },
    {
      key: "xmlFeedUrl",
      name: "Flux annonces",
      source_type: "xml_feed"
    },
    {
      key: "apiUrl",
      name: "Connexion annonces",
      source_type: "api"
    }
  ];

  const results: Array<PromiseLike<{ error: unknown }> | { error: unknown }> = [];

  for (const source of sources) {
    const sourceUrl = data[source.key];
    if (!sourceUrl) continue;

    results.push(upsertPropertySource(supabase, {
      agency_id: agencyId,
      source_type: source.source_type,
      name: source.name,
      source_url: sourceUrl,
      status,
      check_frequency_minutes: 360
    }));
  }

  return results.length ? Promise.all(results) : [{ error: null }];
}

function successMessageFor(stepKey: string) {
  if (stepKey === "final_test") {
    return "Informations recues. L'equipe Nesto verifie votre installation et vous accompagnera pour le test final. Delai moyen : moins de 24h.";
  }

  return "Informations recues. L'equipe Nesto les verifiera pour finaliser votre installation.";
}

async function upsertPropertySource(
  supabase: SupabaseAdmin,
  payload: {
    agency_id: string;
    source_type: string;
    name: string;
    source_url: string;
    status: string;
    check_frequency_minutes: number;
  }
) {
  const { data: existing, error: existingError } = await supabase
    .from("property_sources")
    .select("id")
    .eq("agency_id", payload.agency_id)
    .eq("source_url", payload.source_url)
    .limit(1);

  if (existingError) return { error: existingError };

  const existingId = Array.isArray(existing) ? existing[0]?.id : null;
  const upsertPayload = existingId ? { id: existingId, ...payload } : payload;

  return supabase.from("property_sources").upsert(upsertPayload);
}

async function collectError(errors: string[], query: PromiseLike<{ error: unknown }> | { error: unknown }) {
  const result = "then" in query ? await query : query;
  if (result.error) errors.push(getErrorMessage(result.error));
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) return String(error.message);
  return String(error || "Erreur inconnue.");
}

type SupabaseAdmin = NonNullable<ReturnType<typeof createSupabaseAdminClientOrNull>>;
