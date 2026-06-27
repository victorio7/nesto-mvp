import "server-only";
import { getClapyReadyEmail, sendEmail } from "@/lib/email/send-email";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";
import { isTeamAccessEnabled } from "@/lib/team-auth";

const timeoutMs = 8000;
export const teamInstallationStepKey = "team_installation";

export type TeamInstallStatus = "new" | "in_progress" | "blocked" | "ready_to_test" | "installed";
export type TeamChecklistStatus = "todo" | "in_progress" | "needs_help" | "connected" | "validated" | "skipped";

export type TeamInstallation = {
  id: string;
  agentId: string;
  agencyId: string;
  agencyName: string;
  agentName: string;
  phone: string;
  email: string;
  websiteUrl: string;
  testStatus: "active_test" | null;
  globalStatus: TeamInstallStatus;
  lastUpdated: string;
  nextAction: string;
  notes: string;
  checklist: Array<{
    key: string;
    label: string;
    status: TeamChecklistStatus;
  }>;
  connections: Array<{
    type: string;
    label: string;
    status: string;
    detail: string;
  }>;
  propertySources: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    status: string;
  }>;
  installDetails: Array<{
    label: string;
    value: string;
  }>;
  history: Array<{
    label: string;
    status: string;
    date: string;
  }>;
};

export type TeamInstallationsData = {
  enabled: boolean;
  connected: boolean;
  error: string | null;
  installations: TeamInstallation[];
};

type SupabaseAdmin = NonNullable<ReturnType<typeof createSupabaseAdminClientOrNull>>;

const connectionLabels: Record<string, string> = {
  whatsapp_prospect: "WhatsApp professionnel",
  whatsapp_agent: "WhatsApp agent",
  agency_website: "Site agence",
  gmail: "Gmail",
  outlook: "Outlook",
  google_calendar: "Google Calendar",
  messenger: "Messenger",
  instagram: "Instagram",
  facebook_page: "Facebook"
};

type AgentRow = Record<string, unknown> & {
  duplicate_ids?: string[];
  source_tables?: string[];
};

export async function getTeamInstallationsData(): Promise<TeamInstallationsData> {
  if (!isTeamAccessEnabled()) {
    return { enabled: false, connected: false, error: null, installations: [] };
  }

  const supabase = createSupabaseAdminClientOrNull();
  if (!supabase) {
    return {
      enabled: true,
      connected: false,
      error: "Supabase n'est pas configure.",
      installations: []
    };
  }

  try {
    const agenciesResult = await readRows(
      supabase.from("agencies").select("*").order("created_at", { ascending: false }).limit(50)
    );

    if (agenciesResult.error) {
      return { enabled: true, connected: false, error: agenciesResult.error, installations: [] };
    }

    const agencyRows = agenciesResult.rows.map(asRecord);
    const agencyIds = agencyRows.map((agency) => text(agency.id)).filter(Boolean);
    if (!agencyIds.length) {
      return { enabled: true, connected: true, error: null, installations: [] };
    }

    const [usersResult, profilesResult, stepsResult, integrationsResult, channelsResult, sourcesResult] =
      await Promise.all([
        readRows(supabase.from("agency_users").select("*").in("agency_id", agencyIds).order("created_at", { ascending: true })),
        readRows(supabase.from("profiles").select("*").in("agency_id", agencyIds).order("created_at", { ascending: true })),
        readRows(supabase.from("onboarding_steps").select("*").in("agency_id", agencyIds)),
        readRows(supabase.from("integration_connections").select("*").in("agency_id", agencyIds)),
        readRows(supabase.from("agent_notification_channels").select("*").in("agency_id", agencyIds).order("created_at", { ascending: false })),
        readRows(supabase.from("property_sources").select("*").in("agency_id", agencyIds).order("created_at", { ascending: false }))
      ]);

    const error = firstError([
      usersResult.error,
      profilesResult.error,
      stepsResult.error,
      integrationsResult.error,
      channelsResult.error,
      sourcesResult.error
    ]);

    const installations = agencyRows.flatMap((agency) => {
      const agencyId = text(agency.id);
      const agencySteps = stepsResult.rows.map(asRecord).filter((row) => text(row.agency_id) === agencyId);
      const agencyChannels = channelsResult.rows.map(asRecord).filter((row) => text(row.agency_id) === agencyId);
      const users = mergeAgentRows({
        profiles: profilesResult.rows.map(asRecord).filter((row) => text(row.agency_id) === agencyId),
        users: usersResult.rows.map(asRecord).filter((row) => text(row.agency_id) === agencyId),
        steps: agencySteps,
        channels: agencyChannels
      });

      return users.map((user) => buildInstallation({
        agency,
        agent: user,
        channels: agencyChannels,
        integrations: integrationsResult.rows.map(asRecord).filter((row) => text(row.agency_id) === agencyId),
        sources: sourcesResult.rows.map(asRecord).filter((row) => text(row.agency_id) === agencyId),
        steps: agencySteps
      }));
    });

    return { enabled: true, connected: !error, error, installations };
  } catch (error) {
    return { enabled: true, connected: false, error: getErrorMessage(error), installations: [] };
  }
}

export async function getTeamInstallationById(id: string) {
  const data = await getTeamInstallationsData();
  return {
    ...data,
    installation: data.installations.find((installation) => installation.id === id || installation.agentId === id) ?? null
  };
}

function buildInstallation({
  agent,
  agency,
  channels,
  integrations,
  sources,
  steps
}: {
  agent: Record<string, unknown>;
  agency: Record<string, unknown>;
  channels: Record<string, unknown>[];
  integrations: Record<string, unknown>[];
  sources: Record<string, unknown>[];
  steps: Record<string, unknown>[];
}): TeamInstallation {
  const agencyId = text(agency.id);
  const agentId = text(agent.id);
  const duplicateIds = duplicateAgentIds(agent);
  const duplicateIdSet = new Set(duplicateIds);
  const agentTeamStepKeys = new Set(duplicateIds.map(teamInstallationStepKeyForAgent));
  const relevantSteps = steps.filter((step) => {
    const stepKey = text(step.step_key);
    return agentTeamStepKeys.has(stepKey) || !stepKey.startsWith(`${teamInstallationStepKey}:`);
  });
  const stepMap = new Map(steps.map((step) => [text(step.step_key), step]));
  const integrationMap = new Map(integrations.map((integration) => [text(integration.integration_type), integration]));
  const professionalEmailData = asRecord(stepMap.get("professional_email")?.data);
  const socialSourcesData = asRecord(stepMap.get("social_sources")?.data);
  const teamStep = latestStep(relevantSteps.filter((step) => agentTeamStepKeys.has(text(step.step_key))))
    ?? stepMap.get(teamInstallationStepKey);
  const teamData = asRecord(teamStep?.data);
  const websiteSource = sources[0];
  const agentWhatsapp = channels.find((channel) => text(channel.channel_type) === "whatsapp" && duplicateIdSet.has(text(channel.user_id)))
    ?? channels.find((channel) => text(channel.channel_type) === "whatsapp");
  const siteStatus = strongestStatus([
    statusFromIntegration(integrationMap.get("agency_website")),
    statusFromPropertySources(sources),
    statusFromStep(stepMap.get("agency_website"))
  ]);
  const extraStatus = optionalConnectionStatus(
    statusFromStep(stepMap.get("professional_email")),
    [
      statusFromIntegration(integrationMap.get("gmail")),
      statusFromIntegration(integrationMap.get("outlook")),
      statusFromIntegration(integrationMap.get("google_calendar")),
      statusFromStep(stepMap.get("extra_sources"))
    ]
  );
  const socialStatus = optionalConnectionStatus(
    statusFromStep(stepMap.get("social_sources")),
    [
      statusFromIntegration(integrationMap.get("messenger")),
      statusFromIntegration(integrationMap.get("instagram")),
      statusFromIntegration(integrationMap.get("facebook_page"))
    ]
  );
  const finalTestStatus = statusFromStep(stepMap.get("final_test"));
  const checklist = [
    {
      key: "installation_requested",
      label: "Installation demandee",
      status: (teamStep || finalTestStatus !== "todo" ? "connected" : "todo") as TeamChecklistStatus
    },
    {
      key: "agency_info",
      label: "Informations recues",
      status: strongestStatus([hasAgentIdentity(agent) ? "validated" : "todo", statusFromStep(stepMap.get("agency_info"))])
    },
    {
      key: "whatsapp_prospect",
      label: "WhatsApp professionnel",
      status: strongestStatus([statusFromIntegration(integrationMap.get("whatsapp_prospect")), statusFromStep(stepMap.get("whatsapp_prospect"))])
    },
    {
      key: "whatsapp_agent",
      label: "WhatsApp agent",
      status: strongestStatus([
        agentWhatsapp ? normalizeConnectionStatus(agentWhatsapp.status) : "todo",
        statusFromIntegration(integrationMap.get("whatsapp_agent")),
        statusFromStep(stepMap.get("whatsapp_agent"))
      ])
    },
    {
      key: "agency_website",
      label: "Site agence",
      status: siteStatus
    },
    {
      key: "extra_sources",
      label: "Email / calendrier a connecter",
      status: extraStatus
    },
    {
      key: "social_sources",
      label: "Messenger / Instagram / Facebook",
      status: socialStatus
    },
    {
      key: "final_test",
      label: "Test final",
      status: finalTestStatus
    }
  ];
  const globalStatus = normalizeGlobalStatus(teamData.global_status) ?? inferGlobalStatus(checklist);
  const propertySources = sources.map((source) => ({
    id: text(source.id),
    name: text(source.name) || "Source agence",
    status: text(source.status) || "pending",
    type: text(source.source_type) || "website",
    url: text(source.source_url)
  }));
  const installDetails = [
    {
      label: "WhatsApp professionnel",
      value: phoneFromIntegration(integrationMap.get("whatsapp_prospect"))
    },
    {
      label: "WhatsApp agent",
      value: text(agentWhatsapp?.phone_number) || phoneFromIntegration(integrationMap.get("whatsapp_agent"))
    },
    {
      label: "Site agence",
      value: text(agency.website_url) || text(websiteSource?.source_url) || integrationDetail(integrationMap.get("agency_website"))
    },
    {
      label: "Email",
      value: emailFromIntegration(integrationMap.get("gmail")) || emailFromIntegration(integrationMap.get("outlook")) || text(professionalEmailData.email)
    },
    {
      label: "Messenger / Facebook",
      value: integrationDetail(integrationMap.get("messenger")) || integrationDetail(integrationMap.get("facebook_page")) || text(socialSourcesData.facebookMessenger)
    },
    {
      label: "Instagram",
      value: integrationDetail(integrationMap.get("instagram")) || text(socialSourcesData.instagram)
    },
    {
      label: "TikTok",
      value: text(socialSourcesData.tiktok)
    }
  ].filter((detail) => detail.value);

  return {
    id: agentId,
    agentId,
    agencyId,
    agencyName: text(agency.name) || "Agence sans nom",
    agentName: text(agent.full_name) || "Agent a confirmer",
    phone: text(agent.phone) || text(agentWhatsapp?.phone_number) || phoneFromIntegration(integrationMap.get("whatsapp_agent")) || phoneFromIntegration(integrationMap.get("whatsapp_prospect")),
    email: text(agent.email),
    websiteUrl: text(agency.website_url) || text(websiteSource?.source_url),
    testStatus: normalizeTestStatus(teamData.test_status),
    globalStatus,
    lastUpdated: latestDate([
      text(agency.created_at),
      ...relevantSteps.map((step) => text(step.updated_at)),
      ...integrations.map((integration) => text(integration.updated_at)),
      ...channels.map((channel) => text(channel.created_at)),
      ...sources.map((source) => text(source.created_at))
    ]),
    nextAction: nextActionFor(checklist, globalStatus),
    notes: text(teamData.notes),
    checklist,
    connections: integrations.map((integration) => ({
      type: text(integration.integration_type),
      label: connectionLabels[text(integration.integration_type)] ?? text(integration.integration_type),
      status: text(integration.status) || "not_connected",
      detail: integrationDetail(integration)
    })),
    propertySources,
    installDetails,
    history: relevantSteps
      .map((step) => ({
        label: stepLabel(text(step.step_key)),
        status: stepStatusLabel(text(step.status)),
        date: text(step.updated_at)
      }))
      .sort((a, b) => timestamp(b.date) - timestamp(a.date))
  };
}

export async function updateTeamInstallationStatus(agentId: string, status: TeamInstallStatus) {
  if (!isTeamAccessEnabled()) return { ok: false, message: "Acces equipe desactive." };

  const supabase = createSupabaseAdminClientOrNull();
  if (!supabase) return { ok: false, message: "Supabase n'est pas configure." };

  const agent = await findAgentById(supabase, agentId);
  if (!agent) return { ok: false, message: "Dossier agent introuvable." };

  const existingData = await readTeamInstallationData(supabase, agent.agencyId, agent.id);
  const onboardingStatus = status === "installed" ? "completed" : status === "blocked" ? "needs_help" : "pending";
  const { error } = await supabase.from("onboarding_steps").upsert(
    {
      agency_id: agent.agencyId,
      step_key: teamInstallationStepKeyForAgent(agent.id),
      status: onboardingStatus,
      data: {
        ...existingData,
        global_status: status,
        agent_id: agent.id,
        agent_name: agent.name,
        updated_by: "team",
        label: globalStatusLabel(status)
      },
      updated_at: new Date().toISOString()
    },
    { onConflict: "agency_id,step_key" }
  );

  if (error) return { ok: false, message: getErrorMessage(error) };

  if (status === "installed") {
    const finalTestResult = await supabase.from("onboarding_steps").upsert(
      {
        agency_id: agent.agencyId,
        step_key: "final_test",
        status: "completed",
        data: {
          installed_by: "team",
          agent_id: agent.id,
          agent_name: agent.name,
          label: "Installation terminee"
        },
        updated_at: new Date().toISOString()
      },
      { onConflict: "agency_id,step_key" }
    );

    if (finalTestResult.error) return { ok: false, message: getErrorMessage(finalTestResult.error) };

    if (text(existingData.global_status) !== "installed") {
      const readyEmail = getClapyReadyEmail(firstNameFrom(agent.name));
      await sendEmail({
        to: agent.email,
        ...readyEmail
      });
    }
  }

  return { ok: true, message: `Installation marquee : ${globalStatusLabel(status)}.` };
}

export async function updateTeamInstallationTestStatus(agentId: string, testStatus: "active_test") {
  if (!isTeamAccessEnabled()) return { ok: false, message: "Acces equipe desactive." };

  const supabase = createSupabaseAdminClientOrNull();
  if (!supabase) return { ok: false, message: "Supabase n'est pas configure." };

  const agent = await findAgentById(supabase, agentId);
  if (!agent) return { ok: false, message: "Dossier agent introuvable." };

  const existingData = await readTeamInstallationData(supabase, agent.agencyId, agent.id);
  const { error } = await supabase.from("onboarding_steps").upsert(
    {
      agency_id: agent.agencyId,
      step_key: teamInstallationStepKeyForAgent(agent.id),
      status: text(existingData.global_status) === "installed" ? "completed" : "pending",
      data: {
        ...existingData,
        test_status: testStatus,
        agent_id: agent.id,
        agent_name: agent.name,
        updated_by: "team"
      },
      updated_at: new Date().toISOString()
    },
    { onConflict: "agency_id,step_key" }
  );

  if (error) return { ok: false, message: getErrorMessage(error) };
  return { ok: true, message: "Dossier de test conserve dans les actifs." };
}

async function readTeamInstallationData(supabase: SupabaseAdmin, agencyId: string, agentId: string) {
  const result = await readRows(
    supabase
      .from("onboarding_steps")
      .select("data")
      .eq("agency_id", agencyId)
      .eq("step_key", teamInstallationStepKeyForAgent(agentId))
      .limit(1)
  );

  return asRecord(result.rows[0]?.data);
}

function normalizeTestStatus(value: unknown): "active_test" | null {
  return text(value) === "active_test" ? "active_test" : null;
}

function statusFromStep(step?: Record<string, unknown>): TeamChecklistStatus {
  const status = text(step?.status);
  if (status === "completed") return "validated";
  if (status === "needs_help") return "needs_help";
  if (status === "pending") return "in_progress";
  if (status === "skipped") return "skipped";
  return "todo";
}

function teamInstallationStepKeyForAgent(agentId: string) {
  return `${teamInstallationStepKey}:${agentId}`;
}

async function findAgentById(supabase: SupabaseAdmin, agentId: string) {
  const userResult = await readRows(supabase.from("agency_users").select("id, agency_id, full_name, email").eq("id", agentId).limit(1));
  const user = asRecord(userResult.rows[0]);
  if (text(user.id) && text(user.agency_id)) {
    return {
      id: text(user.id),
      agencyId: text(user.agency_id),
      name: text(user.full_name),
      email: text(user.email)
    };
  }

  const profileResult = await readRows(supabase.from("profiles").select("id, agency_id, full_name, email").eq("id", agentId).limit(1));
  const profile = asRecord(profileResult.rows[0]);
  if (text(profile.id) && text(profile.agency_id)) {
    return {
      id: text(profile.id),
      agencyId: text(profile.agency_id),
      name: text(profile.full_name),
      email: text(profile.email)
    };
  }

  return null;
}

function firstNameFrom(fullName: string) {
  return fullName.split(/\s+/).filter(Boolean)[0] || "bonjour";
}

function mergeAgentRows({
  profiles,
  users,
  steps,
  channels
}: {
  profiles: Record<string, unknown>[];
  users: Record<string, unknown>[];
  steps: Record<string, unknown>[];
  channels: Record<string, unknown>[];
}) {
  const teamAgentIds = new Set(
    steps
      .map((step) => parseTeamInstallationAgentId(text(step.step_key)))
      .filter(Boolean)
  );
  const channelAgentIds = new Set(channels.map((channel) => text(channel.user_id)).filter(Boolean));
  const profileKeys = new Set(profiles.flatMap(agentDedupKeys));
  const candidates = [
    ...users.map((row) => withSourceTable(row, "agency_users")),
    ...profiles.map((row) => withSourceTable(row, "profiles"))
  ].filter((row) => shouldShowAgentInstallation(row, { profileKeys, teamAgentIds, channelAgentIds }));

  const groups: Array<{ keys: Set<string>; rows: AgentRow[] }> = [];

  for (const candidate of candidates) {
    const keys = agentDedupKeys(candidate);
    if (!keys.length) continue;
    const group = groups.find((item) => keys.some((key) => item.keys.has(key)));

    if (group) {
      group.rows.push(candidate);
      keys.forEach((key) => group.keys.add(key));
    } else {
      groups.push({ keys: new Set(keys), rows: [candidate] });
    }
  }

  // The team space is a list of installation dossiers, not a raw users table.
  // These rules keep one visible dossier per agent while preserving existing Supabase rows.
  return groups
    .map((group) => mergeAgentGroup(group.rows, { teamAgentIds, channelAgentIds }))
    .sort((a, b) => timestamp(text(b.created_at)) - timestamp(text(a.created_at)));
}

function hasAgentIdentity(agent: Record<string, unknown>) {
  return Boolean(text(agent.full_name) && (text(agent.email) || text(agent.phone)));
}

function withSourceTable(row: Record<string, unknown>, sourceTable: string): AgentRow {
  return { ...row, source_tables: [sourceTable] };
}

function shouldShowAgentInstallation(
  agent: AgentRow,
  context: {
    profileKeys: Set<string>;
    teamAgentIds: Set<string>;
    channelAgentIds: Set<string>;
  }
) {
  const id = text(agent.id);
  const role = text(agent.role);
  const sourceTables = stringArray(agent.source_tables);

  if (sourceTables.includes("profiles")) return true;
  if (["owner", "admin"].includes(role)) return true;
  if (id && (context.teamAgentIds.has(id) || context.channelAgentIds.has(id))) return true;
  if (agentDedupKeys(agent).some((key) => context.profileKeys.has(key))) return true;

  return false;
}

function mergeAgentGroup(
  rows: AgentRow[],
  context: {
    teamAgentIds: Set<string>;
    channelAgentIds: Set<string>;
  }
): AgentRow {
  const sorted = [...rows].sort((a, b) => agentPriority(b, context) - agentPriority(a, context));
  const canonical = sorted[0] ?? {};
  const duplicateIds = unique(sorted.map((row) => text(row.id)).filter(Boolean));
  const sourceTables = unique(sorted.flatMap((row) => stringArray(row.source_tables)));

  return {
    ...canonical,
    full_name: bestText(sorted, "full_name"),
    email: bestText(sorted, "email"),
    phone: bestText(sorted, "phone"),
    role: bestText(sorted, "role"),
    created_at: latestDate(sorted.map((row) => text(row.created_at))) || text(canonical.created_at),
    duplicate_ids: duplicateIds,
    source_tables: sourceTables
  };
}

function agentPriority(
  row: AgentRow,
  context: {
    teamAgentIds: Set<string>;
    channelAgentIds: Set<string>;
  }
) {
  const sourceTables = stringArray(row.source_tables);
  const role = text(row.role);
  const id = text(row.id);
  return [
    sourceTables.includes("agency_users") ? 40 : 0,
    ["owner", "admin"].includes(role) ? 20 : 0,
    id && context.teamAgentIds.has(id) ? 15 : 0,
    id && context.channelAgentIds.has(id) ? 10 : 0,
    completenessScore(row),
    timestamp(text(row.created_at)) / 100000000000
  ].reduce((total, value) => total + Number(value), 0);
}

function agentDedupKeys(agent: Record<string, unknown>) {
  const keys = new Set<string>();
  const id = text(agent.id);
  const authUserId = text(agent.auth_user_id ?? agent.user_id);
  const email = normalizeEmail(agent.email);
  const phone = normalizePhone(agent.phone);
  const name = normalizeName(agent.full_name);

  if (authUserId) keys.add(`auth:${authUserId}`);
  if (email) keys.add(`email:${email}`);
  if (phone) keys.add(`phone:${phone}`);
  if (name) keys.add(`name:${name}`);
  if (id) keys.add(`id:${id}`);

  return Array.from(keys);
}

function parseTeamInstallationAgentId(stepKey: string) {
  const prefix = `${teamInstallationStepKey}:`;
  return stepKey.startsWith(prefix) ? stepKey.slice(prefix.length) : "";
}

function duplicateAgentIds(agent: Record<string, unknown>) {
  return unique([...stringArray(agent.duplicate_ids), text(agent.id)].filter(Boolean));
}

function latestStep(steps: Record<string, unknown>[]) {
  return [...steps].sort((a, b) => timestamp(text(b.updated_at)) - timestamp(text(a.updated_at)))[0];
}

function bestText(rows: Record<string, unknown>[], field: string) {
  return [...rows]
    .map((row) => text(row[field]))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)[0] ?? "";
}

function completenessScore(row: Record<string, unknown>) {
  return ["full_name", "email", "phone"].reduce((score, field) => score + (text(row[field]) ? 5 : 0), 0);
}

function normalizeEmail(value: unknown) {
  return text(value).trim().toLowerCase();
}

function normalizePhone(value: unknown) {
  return text(value).replace(/\D/g, "");
}

function normalizeName(value: unknown) {
  return text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

function statusFromIntegration(integration?: Record<string, unknown>): TeamChecklistStatus {
  return integration ? normalizeConnectionStatus(integration.status) : "todo";
}

function statusFromPropertySources(sources: Record<string, unknown>[]): TeamChecklistStatus {
  if (!sources.length) return "todo";
  const statuses = sources.map((source) => normalizeConnectionStatus(source.status));
  return strongestStatus(statuses);
}

function normalizeConnectionStatus(value: unknown): TeamChecklistStatus {
  const status = text(value);
  if (status === "connected") return "connected";
  if (status === "pending") return "in_progress";
  if (status === "error" || status === "failed") return "needs_help";
  return "todo";
}

function strongestStatus(statuses: TeamChecklistStatus[]): TeamChecklistStatus {
  if (statuses.includes("validated")) return "validated";
  if (statuses.includes("connected")) return "connected";
  if (statuses.includes("needs_help")) return "needs_help";
  if (statuses.includes("in_progress")) return "in_progress";
  if (statuses.includes("skipped")) return "skipped";
  return "todo";
}

function optionalConnectionStatus(
  explicitStepStatus: TeamChecklistStatus,
  otherStatuses: TeamChecklistStatus[]
) {
  if (explicitStepStatus === "skipped") return "skipped";
  return strongestStatus([...otherStatuses, explicitStepStatus]);
}

function inferGlobalStatus(checklist: TeamInstallation["checklist"]): TeamInstallStatus {
  const core = checklist.filter((item) => item.key !== "social_sources");
  if (core.every((item) => ["connected", "validated", "skipped"].includes(item.status))) return "installed";
  if (checklist.some((item) => item.status === "needs_help")) return "blocked";
  if (checklist.find((item) => item.key === "final_test")?.status === "in_progress") return "ready_to_test";
  if (checklist.some((item) => ["in_progress", "connected", "validated"].includes(item.status))) return "in_progress";
  return "new";
}

function nextActionFor(checklist: TeamInstallation["checklist"], status: TeamInstallStatus) {
  if (status === "installed") return "Installation terminee. Surveiller les premiers retours.";
  if (status === "ready_to_test") return "Lancer le test final avec le client.";
  const helpItem = checklist.find((item) => item.status === "needs_help");
  if (helpItem) return `Debloquer : ${helpItem.label}.`;
  const todoItem = checklist.find((item) => item.status === "todo");
  if (todoItem) return `Completer : ${todoItem.label}.`;
  return "Verifier les connexions puis preparer le test final.";
}

function phoneFromIntegration(integration?: Record<string, unknown>) {
  const config = asRecord(integration?.config);
  return text(config.phone_number ?? config.phone);
}

function emailFromIntegration(integration?: Record<string, unknown>) {
  const config = asRecord(integration?.config);
  return text(config.email);
}

function integrationDetail(integration?: Record<string, unknown>) {
  const config = asRecord(integration?.config);
  return text(config.phone_number ?? config.phone ?? config.email ?? config.website_url ?? config.rental_url ?? config.label);
}

function stepLabel(stepKey: string) {
  if (stepKey.startsWith(`${teamInstallationStepKey}:`)) return "Statut equipe agent";

  const labels: Record<string, string> = {
    installation_requested: "Installation demandee",
    agency_info: "Informations recues",
    whatsapp_prospect: "WhatsApp professionnel",
    whatsapp_agent: "WhatsApp agent",
    agency_website: "Site agence",
    professional_email: "Email professionnel",
    extra_sources: "Email / calendrier",
    social_sources: "Reseaux sociaux",
    final_test: "Test final",
    [teamInstallationStepKey]: "Statut equipe"
  };
  return labels[stepKey] ?? stepKey;
}

function stepStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "En cours",
    completed: "Valide",
    skipped: "Ignore",
    needs_help: "Besoin d'aide"
  };
  return labels[status] ?? (status || "A faire");
}

function normalizeGlobalStatus(status: unknown): TeamInstallStatus | null {
  const value = text(status);
  if (["new", "in_progress", "blocked", "ready_to_test", "installed"].includes(value)) {
    return value as TeamInstallStatus;
  }
  return null;
}

export function globalStatusLabel(status: TeamInstallStatus) {
  const labels: Record<TeamInstallStatus, string> = {
    new: "Nouveau",
    in_progress: "En cours",
    blocked: "Bloque",
    ready_to_test: "Pret a tester",
    installed: "Installe"
  };
  return labels[status];
}

export function checklistStatusLabel(status: TeamChecklistStatus) {
  const labels: Record<TeamChecklistStatus, string> = {
    todo: "A faire",
    in_progress: "En cours",
    needs_help: "Besoin d'aide",
    connected: "Connecte",
    validated: "Valide",
    skipped: "Non renseignee"
  };
  return labels[status];
}

function latestDate(values: string[]) {
  const sorted = values.filter(Boolean).sort((a, b) => timestamp(b) - timestamp(a));
  return sorted[0] ?? "";
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

function timestamp(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}
