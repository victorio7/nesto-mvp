import { getActiveAgentWorkspace, type AgentWorkspace } from "@/lib/agent-workspace";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";
import {
  runWhatsAppSimulatorScenario,
  type SimulatorResponse,
  type SimulatorScenario
} from "@/lib/prototype/whatsapp-simulator";

const localModeMessage = "Mode simulation locale : OpenAI ou Supabase non configure.";
const supabaseTimeoutMs = 8000;

type SupabaseWriteResult = SimulatorResponse & {
  supabase: {
    configured: boolean;
    persisted: boolean;
    message: string;
    error?: string;
  };
};

type ScenarioRefs = {
  contactId: string;
  propertyId: string;
  matchId: string;
  actionId: string;
};

type SimulatorContext = {
  workspace: AgentWorkspace;
  colleagueId: string | null;
  colleagueName: string;
};

type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClientOrNull> extends infer Client ? NonNullable<Client> : never;

export async function getSimulatorMemoryState() {
  const supabase = createSupabaseAdminClientOrNull();

  if (!supabase) {
    return {
      configured: false,
      persisted: false,
      message: localModeMessage,
      openai_configured: Boolean(process.env.OPENAI_API_KEY),
      counts: getLocalCounts()
    };
  }

  try {
    const workspace = await getActiveAgentWorkspace(supabase);
    if (!workspace) {
      return {
        configured: true,
        persisted: false,
        message: "Mode simulation locale : aucun espace agent actif.",
        openai_configured: Boolean(process.env.OPENAI_API_KEY),
        counts: getLocalCounts()
      };
    }

    const contactIds = await getActiveContactIds(supabase, workspace);
    const [contacts, properties, messages, matches, actions] = await Promise.all([
      countRows(supabase.from("contacts").select("*", { count: "exact", head: true }).eq("agency_id", workspace.agencyId).eq("owner_user_id", workspace.userId)),
      countRows(supabase.from("properties").select("*", { count: "exact", head: true }).eq("agency_id", workspace.agencyId)),
      contactIds.length
        ? countRows(supabase.from("messages").select("*", { count: "exact", head: true }).eq("agency_id", workspace.agencyId).in("contact_id", contactIds))
        : 0,
      countRows(supabase.from("matches").select("*", { count: "exact", head: true }).eq("agency_id", workspace.agencyId).eq("contact_owner_user_id", workspace.userId)),
      countRows(supabase.from("ai_action_proposals").select("*", { count: "exact", head: true }).eq("agency_id", workspace.agencyId).eq("user_id", workspace.userId))
    ]);

    return {
      configured: true,
      persisted: true,
      message: `Memoire Supabase connectee pour ${workspace.fullName || "l'agent actif"}.`,
      openai_configured: Boolean(process.env.OPENAI_API_KEY),
      counts: { contacts, properties, messages, matches, actions }
    };
  } catch (error) {
    return {
      configured: true,
      persisted: false,
      message: getSupabaseFallbackMessage(error),
      openai_configured: Boolean(process.env.OPENAI_API_KEY),
      error: getErrorMessage(error),
      counts: getLocalCounts()
    };
  }
}

export async function persistSimulatorScenario(
  scenario: SimulatorScenario,
  rawCommand = "1"
): Promise<SupabaseWriteResult> {
  const response = runWhatsAppSimulatorScenario(scenario, rawCommand);
  const supabase = createSupabaseAdminClientOrNull();

  if (!supabase) {
    return withSupabaseMeta(response, false, false, localModeMessage);
  }

  try {
    const context = await getSimulatorContext(supabase);
    if (!context) return withSupabaseMeta(response, true, false, "Mode simulation locale : aucun espace agent actif.");

    if (scenario === "prospect_message") {
      await persistProspectMessage(supabase, context, response);
    } else if (scenario === "call_summary") {
      await persistCallSummary(supabase, context, response);
    } else if (scenario === "new_property_personal" || scenario === "new_property") {
      await persistPropertyDetected(supabase, context, response, "personal");
    } else if (scenario === "new_property_colleague") {
      await persistPropertyDetected(supabase, context, response, "colleague");
    } else if (scenario === "agent_command_validate" || scenario === "agent_command") {
      await persistAgentCommand(supabase, context, response, rawCommand, "validate");
    } else if (scenario === "agent_command_details") {
      await persistAgentCommand(supabase, context, response, rawCommand, "details");
    } else if (scenario === "complete_flow") {
      await persistCallSummary(supabase, context, response);
      await persistPropertyDetected(supabase, context, response, "colleague");
      await persistAgentCommand(supabase, context, response, rawCommand, "validate");
    }

    return withSupabaseMeta(response, true, true, "Scenario enregistre dans Supabase.");
  } catch (error) {
    return withSupabaseMeta(
      response,
      true,
      false,
      getSupabaseFallbackMessage(error),
      getErrorMessage(error)
    );
  }
}

async function getSimulatorContext(supabase: SupabaseAdmin): Promise<SimulatorContext | null> {
  const workspace = await getActiveAgentWorkspace(supabase);
  if (!workspace) return null;
  const colleague = await findOrCreateColleague(supabase, workspace);

  return {
    workspace,
    colleagueId: colleague.id,
    colleagueName: colleague.fullName || "Marc"
  };
}

async function persistProspectMessage(supabase: SupabaseAdmin, context: SimulatorContext, response: SimulatorResponse) {
  const contactId = await upsertSarah(supabase, context.workspace);
  const conversation = await createConversation(supabase, context.workspace, "whatsapp_prospect", contactId, null);
  await insertMessages(
    supabase,
    context.workspace,
    conversation.id,
    contactId,
    response.prospectConversation.map((message) => ({
      direction: message.from === "Prospect" ? "inbound" : "outbound",
      sender_type: message.from === "Prospect" ? "prospect" : "nesto",
      raw_content: message.text,
      structured_data: response.result.details ?? {}
    }))
  );
}

async function persistCallSummary(supabase: SupabaseAdmin, context: SimulatorContext, response: SimulatorResponse) {
  const contactId = await upsertSarah(supabase, context.workspace);
  const conversation = await createConversation(supabase, context.workspace, "whatsapp_agent", null, context.workspace.userId);
  await insertMessages(
    supabase,
    context.workspace,
    conversation.id,
    contactId,
    response.agentConversation.map((message) => ({
      direction: message.from === "Agent" ? "inbound" : "outbound",
      sender_type: message.from === "Agent" ? "agent" : "nesto",
      raw_content: message.text,
      structured_data: response.result.details ?? {}
    }))
  );
}

async function persistPropertyDetected(
  supabase: SupabaseAdmin,
  context: SimulatorContext,
  response: SimulatorResponse,
  source: "personal" | "colleague"
): Promise<ScenarioRefs> {
  const contactId = await upsertSarah(supabase, context.workspace);
  const isColleague = source === "colleague";
  const propertyId = await upsertDetectedProperty(supabase, context, isColleague);
  const matchId = await upsertMatch(supabase, context, contactId, propertyId, isColleague);
  const actionId = await upsertAction(supabase, context, contactId, propertyId, matchId, isColleague);

  const conversation = await createConversation(supabase, context.workspace, "whatsapp_agent", null, context.workspace.userId);
  await insertMessages(
    supabase,
    context.workspace,
    conversation.id,
    contactId,
    response.agentConversation.map((message) => ({
      direction: message.from === "Site agence" ? "inbound" : "outbound",
      sender_type: message.from === "Site agence" ? "agent" : "nesto",
      raw_content: message.text,
      structured_data: response.result.records
    }))
  );

  return { contactId, propertyId, matchId, actionId };
}

async function persistAgentCommand(
  supabase: SupabaseAdmin,
  context: SimulatorContext,
  response: SimulatorResponse,
  rawCommand: string,
  mode: "validate" | "details"
) {
  const refs = await persistPropertyDetected(supabase, context, response, "colleague");
  const interpreted = response.result.records.interpreted_command ?? { intent: mode };
  const status = mode === "validate" ? "executed" : "understood";

  await throwOnError(
    supabase.from("agent_commands").insert({
      agency_id: context.workspace.agencyId,
      user_id: context.workspace.userId,
      source_channel: "whatsapp",
      raw_command: rawCommand,
      interpreted_command: interpreted,
      related_action_id: refs.actionId,
      status
    })
  );

  if (mode === "validate") {
    await throwOnError(
      supabase
        .from("ai_action_proposals")
        .update({ status: "validated", validated_at: new Date().toISOString() })
        .eq("id", refs.actionId)
        .eq("user_id", context.workspace.userId)
    );
    await throwOnError(
      supabase
        .from("matches")
        .update({ status: "validated" })
        .eq("id", refs.matchId)
        .eq("contact_owner_user_id", context.workspace.userId)
    );
  }

  const conversation = await createConversation(supabase, context.workspace, "whatsapp_agent", null, context.workspace.userId);
  await insertMessages(
    supabase,
    context.workspace,
    conversation.id,
    refs.contactId,
    response.agentConversation.slice(-2).map((message) => ({
      direction: message.from === "Agent" ? "inbound" : "outbound",
      sender_type: message.from === "Agent" ? "agent" : "nesto",
      raw_content: message.text,
      structured_data: { interpreted }
    }))
  );

  const followup = response.result.records.followup_message;
  if (typeof followup === "string") {
    const prospectConversation = await createConversation(supabase, context.workspace, "whatsapp_prospect", refs.contactId, null);
    await insertMessages(supabase, context.workspace, prospectConversation.id, refs.contactId, [
      {
        direction: "outbound",
        sender_type: "nesto",
        raw_content: followup,
        structured_data: { simulated_send: true }
      }
    ]);
  }
}

async function upsertSarah(supabase: SupabaseAdmin, workspace: AgentWorkspace) {
  const existing = await findOne(supabase
    .from("contacts")
    .select("id")
    .eq("agency_id", workspace.agencyId)
    .eq("owner_user_id", workspace.userId)
    .eq("phone", "+689 87 12 34 56")
    .limit(1));

  const payload = {
    agency_id: workspace.agencyId,
    owner_user_id: workspace.userId,
    first_name: "Sarah",
    last_name: "M.",
    phone: "+689 87 12 34 56",
    email: "sarah@example.com",
    source_channel: "whatsapp_prospect",
    contact_type: "tenant",
    project_type: "rental_search",
    min_budget: null,
    max_budget: 220000,
    desired_city: "Punaauia",
    desired_district: "Taapuna",
    desired_property_type: "t3",
    desired_bedrooms: 2,
    number_of_people: 3,
    professional_status: "CDI",
    income: null,
    pets: "no",
    move_in_date: "2026-07-01",
    financing_approved: "unknown",
    documents_ready: "unknown",
    urgency: "high",
    seriousness_score: 91,
    status: "hot",
    missing_fields: ["income", "documents_ready"],
    notes: "Recherche recue depuis WhatsApp. Entree souhaitee en juillet."
  };

  if (existing.id) {
    await throwOnError(supabase.from("contacts").update(payload).eq("id", existing.id));
    return text(existing.id);
  }

  const { data, error } = await withTimeout(
    supabase.from("contacts").insert(payload).select("id").single(),
    supabaseTimeoutMs
  );
  if (error) throw error;
  return text(asRecord(data).id);
}

async function upsertDetectedProperty(supabase: SupabaseAdmin, context: SimulatorContext, isColleague: boolean) {
  const sourceUrl = isColleague
    ? "https://mana-immo.example/locations/marc-f3-taapuna"
    : "https://mana-immo.example/locations/mon-f3-taapuna";
  const existing = await findOne(supabase
    .from("properties")
    .select("id")
    .eq("agency_id", context.workspace.agencyId)
    .eq("source_url", sourceUrl)
    .limit(1));
  const payload = {
    agency_id: context.workspace.agencyId,
    created_by_user_id: isColleague ? context.colleagueId : context.workspace.userId,
    source_agent_name: isColleague ? context.colleagueName : null,
    source_agent_id: isColleague ? context.colleagueId : null,
    visibility_scope: "agency",
    title: "F3 Punaauia Taapuna",
    listing_type: "rental",
    category: "t3",
    city: "Punaauia",
    district: "Taapuna",
    price: 210000,
    surface: 72,
    bedrooms: 2,
    available_from: "2026-06-12",
    pets_allowed: "no",
    status: "available",
    description: "F3 Punaauia Taapuna, 210 000 F, disponible maintenant.",
    source_url: sourceUrl,
    source_type: "agency_website"
  };

  if (existing.id) {
    await throwOnError(supabase.from("properties").update(payload).eq("id", existing.id));
    return text(existing.id);
  }

  const { data, error } = await withTimeout(
    supabase.from("properties").insert(payload).select("id").single(),
    supabaseTimeoutMs
  );
  if (error) throw error;
  return text(asRecord(data).id);
}

async function upsertMatch(
  supabase: SupabaseAdmin,
  context: SimulatorContext,
  contactId: string,
  propertyId: string,
  isColleague: boolean
) {
  const existing = await findOne(supabase
    .from("matches")
    .select("id")
    .eq("contact_id", contactId)
    .eq("property_id", propertyId)
    .limit(1));
  const payload = {
    agency_id: context.workspace.agencyId,
    contact_id: contactId,
    property_id: propertyId,
    contact_owner_user_id: context.workspace.userId,
    property_source_agent_name: isColleague ? context.colleagueName : null,
    score: 94,
    reasons: [
      "Budget compatible",
      "Ville compatible",
      "Type de bien compatible",
      "Nombre de chambres compatible",
      ...(isColleague ? ["Bien ajoute par un autre agent de l'agence"] : [])
    ],
    blocking_points: ["Dossier a confirmer avant visite"],
    collaboration_opportunity: isColleague,
    match_context: isColleague ? "colleague_property" : "own_property",
    status: "proposed"
  };

  if (existing.id) {
    await throwOnError(supabase.from("matches").update(payload).eq("id", existing.id));
    return text(existing.id);
  }

  const { data, error } = await withTimeout(
    supabase.from("matches").insert(payload).select("id").single(),
    supabaseTimeoutMs
  );
  if (error) throw error;
  return text(asRecord(data).id);
}

async function upsertAction(
  supabase: SupabaseAdmin,
  context: SimulatorContext,
  contactId: string,
  propertyId: string,
  matchId: string,
  isColleague: boolean
) {
  const actionType = isColleague ? "collaboration_opportunity" : "notify_new_match";
  const existing = await findOne(supabase
    .from("ai_action_proposals")
    .select("id")
    .eq("match_id", matchId)
    .eq("action_type", actionType)
    .limit(1));
  const payload = {
    agency_id: context.workspace.agencyId,
    contact_id: contactId,
    property_id: propertyId,
    match_id: matchId,
    user_id: context.workspace.userId,
    action_type: actionType,
    priority: "urgent",
    title: isColleague ? "Opportunite Sarah x bien de Marc" : "Relancer Sarah",
    summary: "Sarah correspond au bien F3 Punaauia Taapuna avec un score de 94 %.",
    proposed_message:
      "Bonjour Sarah, je reviens vers vous car un F3 a Punaauia vient d'etre ajoute a l'agence. Il est a 210 000 F et semble correspondre a votre recherche. Souhaitez-vous recevoir les informations ou prevoir une visite ?",
    status: "pending",
    requires_validation: true
  };

  if (existing.id) {
    await throwOnError(supabase.from("ai_action_proposals").update(payload).eq("id", existing.id));
    return text(existing.id);
  }

  const { data, error } = await withTimeout(
    supabase.from("ai_action_proposals").insert(payload).select("id").single(),
    supabaseTimeoutMs
  );
  if (error) throw error;
  return text(asRecord(data).id);
}

async function findOrCreateColleague(supabase: SupabaseAdmin, workspace: AgentWorkspace) {
  const existing = await findOne(supabase
    .from("agency_users")
    .select("id, full_name")
    .eq("agency_id", workspace.agencyId)
    .neq("id", workspace.userId)
    .ilike("full_name", "Marc%")
    .limit(1));

  if (existing.id) {
    return {
      id: text(existing.id),
      fullName: text(existing.full_name) || "Marc"
    };
  }

  const { data, error } = await withTimeout(
    supabase
      .from("agency_users")
      .insert({
        agency_id: workspace.agencyId,
        full_name: "Marc",
        email: `marc-${workspace.agencyId.slice(0, 8)}@nesto-demo.local`,
        phone: "+689 87 00 00 02",
        role: "agent"
      })
      .select("id, full_name")
      .single(),
    supabaseTimeoutMs
  );
  if (error) throw error;
  const row = asRecord(data);
  return { id: text(row.id), fullName: text(row.full_name) || "Marc" };
}

async function createConversation(
  supabase: SupabaseAdmin,
  workspace: AgentWorkspace,
  channelType: "whatsapp_prospect" | "whatsapp_agent",
  contactId: string | null,
  userId: string | null
) {
  const { data, error } = await withTimeout(
    supabase
      .from("conversations")
      .insert({
        agency_id: workspace.agencyId,
        contact_id: contactId,
        user_id: userId,
        channel_type: channelType,
        external_thread_id: `${workspace.userId}-${channelType}-${Date.now()}`
      })
      .select("id")
      .single(),
    supabaseTimeoutMs
  );

  if (error) throw error;
  return data as { id: string };
}

async function insertMessages(
  supabase: SupabaseAdmin,
  workspace: AgentWorkspace,
  conversationId: string,
  contactId: string,
  messages: Array<{
    direction: string;
    sender_type: string;
    raw_content: string;
    structured_data: unknown;
  }>
) {
  if (!messages.length) return;

  await throwOnError(
    supabase.from("messages").insert(
      messages.map((message) => ({
        agency_id: workspace.agencyId,
        conversation_id: conversationId,
        contact_id: contactId,
        direction: message.direction,
        sender_type: message.sender_type,
        raw_content: message.raw_content,
        structured_data: message.structured_data ?? {}
      }))
    )
  );
}

async function getActiveContactIds(supabase: SupabaseAdmin, workspace: AgentWorkspace) {
  const { data, error } = await withTimeout(
    supabase
      .from("contacts")
      .select("id")
      .eq("agency_id", workspace.agencyId)
      .eq("owner_user_id", workspace.userId)
      .limit(500),
    supabaseTimeoutMs
  );
  if (error) throw error;
  return (Array.isArray(data) ? data : []).map((row) => text(asRecord(row).id)).filter(Boolean);
}

async function findOne(query: PromiseLike<{ data: unknown; error: unknown }>) {
  const { data, error } = await withTimeout(query, supabaseTimeoutMs);
  if (error) throw error;
  return Array.isArray(data) ? asRecord(data[0]) : asRecord(data);
}

async function countRows(query: PromiseLike<{ count: number | null; error: unknown }>) {
  const { count, error } = await withTimeout(query, supabaseTimeoutMs);
  if (error) throw error;
  return count ?? 0;
}

async function throwOnError(query: PromiseLike<{ error: unknown }>) {
  const result = await withTimeout(query, supabaseTimeoutMs);
  if (result.error) throw result.error;
}

function withTimeout<T>(query: PromiseLike<T>, timeoutMs: number) {
  return Promise.race([
    Promise.resolve(query),
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Supabase connection timed out after ${timeoutMs}ms.`));
      }, timeoutMs);
    })
  ]);
}

function withSupabaseMeta(
  response: SimulatorResponse,
  configured: boolean,
  persisted: boolean,
  message: string,
  error?: string
): SupabaseWriteResult {
  return {
    ...response,
    supabase: {
      configured,
      persisted,
      message,
      error
    }
  };
}

function getLocalCounts() {
  return {
    contacts: 0,
    properties: 0,
    messages: 0,
    matches: 0,
    actions: 0
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  if (typeof error === "object" && error) {
    if ("message" in error && error.message) return String(error.message);

    try {
      return JSON.stringify(error);
    } catch {
      return "Erreur Supabase inconnue.";
    }
  }

  return String(error);
}

function getSupabaseFallbackMessage(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  if (
    message.includes("fetch failed") ||
    message.includes("could not resolve") ||
    message.includes("enotfound") ||
    message.includes("timed out")
  ) {
    return "Mode simulation locale : OpenAI ou Supabase non configure. Supabase est configure mais inaccessible depuis cet environnement.";
  }

  if (message.includes("permission denied")) {
    return "Mode simulation locale : Supabase repond mais refuse la lecture avec la cle serveur actuelle.";
  }

  return "Mode simulation locale : OpenAI ou Supabase non configure. Supabase est configure mais le schema semble incomplet.";
}

function asRecord(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}
