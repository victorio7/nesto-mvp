import "server-only";
import { getActiveAgentWorkspace } from "@/lib/agent-workspace";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";

const timeoutMs = 8000;
const teamInstallationStepKey = "team_installation";

export type SimpleInstallStatus = "todo" | "in_progress" | "connected" | "needs_help" | "skipped";

export type InstallationData = {
  connected: boolean;
  error: string | null;
  agencyId: string | null;
  agency: {
    name: string;
    agentName: string;
    phone: string;
    email: string;
    city: string;
    websiteUrl: string;
  };
  whatsappProspect: {
    phone: string;
    status: SimpleInstallStatus;
  };
  whatsappAgent: {
    phone: string;
    alertPreference: string;
    status: SimpleInstallStatus;
  };
  website: {
    websiteUrl: string;
    rentalUrl: string;
    saleUrl: string;
    status: SimpleInstallStatus;
  };
  professionalEmail: {
    email: string;
    status: SimpleInstallStatus;
  };
  socialSources: {
    facebookMessenger: string;
    instagram: string;
    tiktok: string;
    status: SimpleInstallStatus;
  };
  extraSources: {
    email: string;
    calendar: string;
    social: string;
    status: SimpleInstallStatus;
  };
  teamInstallationStatus: string;
  dashboardUnlocked: boolean;
  steps: Record<string, SimpleInstallStatus>;
};

type SupabaseLike = NonNullable<ReturnType<typeof createSupabaseAdminClientOrNull>>;

export async function getInstallationData(): Promise<InstallationData> {
  const supabase = createSupabaseAdminClientOrNull();
  if (!supabase) return emptyInstallationData("Mode local : Supabase n'est pas configure.");

  try {
    const workspace = await getActiveAgentWorkspace(supabase);
    if (!workspace) return emptyInstallationData(null, true);
    const agencyId = workspace.agencyId;

    const [agencyResult, usersResult, stepsResult, integrationsResult, channelsResult, sourcesResult] =
      await Promise.all([
        readOne(supabase.from("agencies").select("*").eq("id", agencyId).limit(1)),
        readRows(supabase.from("agency_users").select("*").eq("id", workspace.userId).limit(1)),
        readRows(supabase.from("onboarding_steps").select("*").eq("agency_id", agencyId)),
        readRows(supabase.from("integration_connections").select("*").eq("agency_id", agencyId)),
        readRows(supabase.from("agent_notification_channels").select("*").eq("agency_id", agencyId).eq("user_id", workspace.userId).order("created_at", { ascending: false }).limit(5)),
        readRows(supabase.from("property_sources").select("*").eq("agency_id", agencyId).order("created_at", { ascending: false }).limit(5))
      ]);

    const agency = asRecord(agencyResult.row);
    const user = asRecord(usersResult.rows[0]);
    const steps = buildStepStatusMap(stepsResult.rows);
    const teamStep = findTeamInstallationStep(stepsResult.rows, workspace.userId);
    const teamInstallationStatus = teamStatusFromStep(teamStep);
    const integrations = integrationsResult.rows.map(asRecord);
    const channels = channelsResult.rows.map(asRecord);
    const sources = sourcesResult.rows.map(asRecord);
    const websiteSource = sources[0];

    return {
      connected: true,
      error: firstError([
        agencyResult.error,
        usersResult.error,
        stepsResult.error,
        integrationsResult.error,
        channelsResult.error,
        sourcesResult.error
      ]),
      agencyId,
      agency: {
        name: text(agency.name) || "Votre agence",
        agentName: text(user.full_name) || workspace.fullName,
        phone: text(user.phone) || workspace.phone,
        email: text(user.email) || workspace.email,
        city: text(agency.city),
        websiteUrl: text(agency.website_url)
      },
      whatsappProspect: {
        phone: integrationPhone(integrations, "whatsapp_prospect"),
        status: statusFromIntegration(integrations, "whatsapp_prospect", steps.whatsapp_prospect)
      },
      whatsappAgent: {
        phone: text(channels.find((item) => item.channel_type === "whatsapp")?.phone_number) || integrationPhone(integrations, "whatsapp_agent"),
        alertPreference: "Recevoir les alertes importantes",
        status: statusFromIntegration(integrations, "whatsapp_agent", steps.whatsapp_agent)
      },
      website: {
        websiteUrl: text(websiteSource?.source_url) || text(agency.website_url),
        rentalUrl: text(websiteSource?.rental_url),
        saleUrl: text(websiteSource?.sale_url),
        status: statusFromIntegration(integrations, "agency_website", steps.agency_website)
      },
      professionalEmail: {
        email: integrationEmail(integrations) || workspace.email,
        status: professionalEmailStatus(integrations, steps.professional_email ?? steps.extra_sources)
      },
      socialSources: {
        facebookMessenger: socialConfig(integrations, "messenger") || socialConfig(integrations, "facebook_page"),
        instagram: socialConfig(integrations, "instagram"),
        tiktok: text(asRecord(stepsResult.rows.map(asRecord).find((row) => row.step_key === "social_sources")?.data).tiktok),
        status: socialSourcesStatus(integrations, steps.social_sources ?? steps.extra_sources)
      },
      extraSources: {
        email: integrationEmail(integrations),
        calendar: integrationLabel(integrations, "google_calendar"),
        social: socialLabel(integrations),
        status: extraSourcesStatus(integrations, steps.extra_sources)
      },
      teamInstallationStatus,
      dashboardUnlocked: teamInstallationStatus === "installed",
      steps
    };
  } catch (error) {
    return emptyInstallationData(getErrorMessage(error));
  }
}

export async function getWritableInstallationAgencyId(supabase: SupabaseLike) {
  const workspace = await getActiveAgentWorkspace(supabase);
  return workspace?.agencyId ?? null;
}

async function readRows(query: PromiseLike<{ data: unknown; error: unknown }>) {
  try {
    const { data, error } = await withTimeout(query, timeoutMs);
    return {
      rows: Array.isArray(data) ? data : [],
      error: error ? getErrorMessage(error) : null
    };
  } catch (error) {
    return { rows: [], error: getErrorMessage(error) };
  }
}

async function readOne(query: PromiseLike<{ data: unknown; error: unknown }>) {
  const result = await readRows(query);
  return {
    row: result.rows[0] ?? null,
    error: result.error
  };
}

function buildStepStatusMap(rows: unknown[]) {
  const map: Record<string, SimpleInstallStatus> = {};
  for (const row of rows.map(asRecord)) {
    const key = text(row.step_key);
    if (key) map[key] = normalizeStepStatus(row.status);
  }
  return map;
}

function statusFromIntegration(rows: Record<string, unknown>[], type: string, stepStatus?: SimpleInstallStatus) {
  const integration = rows.find((row) => row.integration_type === type);
  if (!integration) return stepStatus ?? "todo";
  return normalizeIntegrationStatus(integration.status);
}

function extraSourcesStatus(rows: Record<string, unknown>[], stepStatus?: SimpleInstallStatus) {
  const sourceTypes = ["gmail", "outlook", "google_calendar", "messenger", "instagram", "facebook_page"];
  const statuses = rows
    .filter((row) => sourceTypes.includes(text(row.integration_type)))
    .map((row) => normalizeIntegrationStatus(row.status));
  if (statuses.includes("connected")) return "connected";
  if (statuses.includes("in_progress")) return "in_progress";
  if (statuses.includes("needs_help")) return "needs_help";
  return stepStatus ?? "todo";
}

function professionalEmailStatus(rows: Record<string, unknown>[], stepStatus?: SimpleInstallStatus) {
  if (stepStatus === "skipped") return "skipped";

  const statuses = rows
    .filter((row) => ["gmail", "outlook"].includes(text(row.integration_type)))
    .map((row) => normalizeIntegrationStatus(row.status));
  if (statuses.includes("connected")) return "connected";
  if (statuses.includes("in_progress")) return "in_progress";
  if (statuses.includes("needs_help")) return "needs_help";
  return stepStatus ?? "todo";
}

function socialSourcesStatus(rows: Record<string, unknown>[], stepStatus?: SimpleInstallStatus) {
  if (stepStatus === "skipped") return "skipped";

  const statuses = rows
    .filter((row) => ["messenger", "instagram", "facebook_page"].includes(text(row.integration_type)))
    .map((row) => normalizeIntegrationStatus(row.status));
  if (statuses.includes("connected")) return "connected";
  if (statuses.includes("in_progress")) return "in_progress";
  if (statuses.includes("needs_help")) return "needs_help";
  return stepStatus ?? "todo";
}

function integrationPhone(rows: Record<string, unknown>[], type: string) {
  const integration = rows.find((row) => row.integration_type === type);
  const config = asRecord(integration?.config);
  return text(config.phone_number ?? config.phone);
}

function integrationEmail(rows: Record<string, unknown>[]) {
  const integration = rows.find((row) => ["gmail", "outlook"].includes(text(row.integration_type)));
  const config = asRecord(integration?.config);
  return text(config.email);
}

function integrationLabel(rows: Record<string, unknown>[], type: string) {
  const integration = rows.find((row) => row.integration_type === type);
  return integration ? statusLabel(normalizeIntegrationStatus(integration.status)) : "";
}

function socialLabel(rows: Record<string, unknown>[]) {
  const social = rows.filter((row) => ["messenger", "instagram", "facebook_page"].includes(text(row.integration_type)));
  if (!social.length) return "";
  return `${social.length} source${social.length > 1 ? "s" : ""} preparee${social.length > 1 ? "s" : ""}`;
}

function socialConfig(rows: Record<string, unknown>[], type: string) {
  const integration = rows.find((row) => text(row.integration_type) === type);
  const config = asRecord(integration?.config);
  return text(config.label ?? config.url ?? config.handle);
}

function normalizeIntegrationStatus(value: unknown): SimpleInstallStatus {
  const status = text(value);
  if (status === "connected") return "connected";
  if (status === "pending") return "in_progress";
  if (status === "error") return "needs_help";
  return "todo";
}

function normalizeStepStatus(value: unknown): SimpleInstallStatus {
  const status = text(value);
  if (status === "completed") return "connected";
  if (status === "needs_help") return "needs_help";
  if (status === "pending") return "in_progress";
  if (status === "skipped") return "skipped";
  return "todo";
}

function statusLabel(status: SimpleInstallStatus) {
  const labels = {
    todo: "A faire",
    in_progress: "En cours",
    connected: "Connecte",
    needs_help: "Besoin d'aide",
    skipped: "Passe"
  };
  return labels[status];
}

function findTeamInstallationStep(rows: unknown[], agentUserId: string) {
  const agentStepKey = `${teamInstallationStepKey}:${agentUserId}`;
  const steps = rows.map(asRecord);
  return steps.find((row) => text(row.step_key) === agentStepKey)
    ?? steps.find((row) => text(row.step_key) === teamInstallationStepKey)
    ?? null;
}

function teamStatusFromStep(step: Record<string, unknown> | null) {
  const data = asRecord(step?.data);
  const globalStatus = text(data.global_status);
  if (globalStatus) return globalStatus;
  return text(step?.status) === "completed" ? "installed" : "";
}

function emptyInstallationData(error: string | null, connected = false): InstallationData {
  return {
    connected,
    error,
    agencyId: null,
    agency: {
      name: "",
      agentName: "",
      phone: "",
      email: "",
      city: "",
      websiteUrl: ""
    },
    whatsappProspect: {
      phone: "",
      status: "todo"
    },
    whatsappAgent: {
      phone: "",
      alertPreference: "Recevoir les alertes importantes",
      status: "todo"
    },
    website: {
      websiteUrl: "",
      rentalUrl: "",
      saleUrl: "",
      status: "todo"
    },
    professionalEmail: {
      email: "",
      status: "todo"
    },
    socialSources: {
      facebookMessenger: "",
      instagram: "",
      tiktok: "",
      status: "todo"
    },
    extraSources: {
      email: "",
      calendar: "",
      social: "",
      status: "todo"
    },
    teamInstallationStatus: "",
    dashboardUnlocked: false,
    steps: {}
  };
}

function withTimeout<T>(query: PromiseLike<T>, ms: number) {
  return Promise.race([
    Promise.resolve(query),
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Supabase timeout after ${ms}ms.`)), ms);
    })
  ]);
}

function firstError(errors: Array<string | null>) {
  return errors.find(Boolean) ?? null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) return String(error.message);
  return String(error || "Erreur Supabase inconnue.");
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}
