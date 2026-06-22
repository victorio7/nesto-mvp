import "server-only";
import { getActiveAgentWorkspace } from "@/lib/agent-workspace";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";
import type {
  AiActionProposal,
  Contact,
  IntegrationConnection,
  Match,
  Property
} from "@/lib/types";

const timeoutMs = 8000;

export type PropertyMemory = Property & {
  compatibleCount: number;
  bestContactName: string | null;
};

export type NestoData = {
  connected: boolean;
  empty: boolean;
  error: string | null;
  agencyId: string | null;
  userId: string | null;
  contacts: Contact[];
  properties: PropertyMemory[];
  matches: Match[];
  actions: AiActionProposal[];
  connections: IntegrationConnection[];
  latestInteractionByContactId: Record<string, string>;
};

export async function getNestoData(): Promise<NestoData> {
  const supabase = createSupabaseAdminClientOrNull();

  if (!supabase) {
    return emptyData("Mode simulation locale : Supabase n'est pas configure.");
  }

  try {
    const workspace = await getActiveAgentWorkspace(supabase);
    if (!workspace) return emptyData(null, true);
    const agencyId = workspace.agencyId;
    const userId = workspace.userId;

    const [contactsResult, propertiesResult, actionsResult, connectionsResult] =
      await Promise.all([
        readRows<ContactRow>(
          supabase
            .from("contacts")
            .select("*")
            .eq("agency_id", agencyId)
            .eq("owner_user_id", userId)
            .order("updated_at", { ascending: false })
            .limit(80)
        ),
        readRows<PropertyRow>(
          supabase
            .from("properties")
            .select("*")
            .eq("agency_id", agencyId)
            .order("updated_at", { ascending: false })
            .limit(120)
        ),
        readRows<AiActionRow>(
          supabase
            .from("ai_action_proposals")
            .select("*")
            .eq("agency_id", agencyId)
            .order("created_at", { ascending: false })
            .limit(120)
        ),
        readRows<IntegrationConnectionRow>(
          supabase
            .from("integration_connections")
            .select("*")
            .eq("agency_id", agencyId)
            .order("updated_at", { ascending: false })
            .limit(30)
        )
      ]);

    const contacts = contactsResult.rows.map(normalizeContact);
    const contactIds = contacts.map((contact) => contact.id).filter(Boolean);

    const [matchesResult, messagesResult] = await Promise.all([
      readRows<MatchRow>(
        supabase
          .from("matches")
          .select("*")
          .eq("agency_id", agencyId)
          .order("score", { ascending: false })
          .limit(160)
      ),
      contactIds.length
        ? readRows<MessageRow>(
            supabase
              .from("messages")
              .select("contact_id, created_at")
              .eq("agency_id", agencyId)
              .in("contact_id", contactIds)
              .order("created_at", { ascending: false })
              .limit(200)
          )
        : Promise.resolve({ rows: [] as MessageRow[], error: null })
    ]);

    const contactIdSet = new Set(contactIds);
    const matches = matchesResult.rows
      .map(normalizeMatch)
      .filter((match) => match.contact_owner_user_id === userId || contactIdSet.has(match.contact_id));
    const propertyIdsWithAgentMatches = new Set(matches.map((match) => match.property_id));
    const contactNames = Object.fromEntries(contacts.map((contact) => [contact.id, getContactName(contact)]));
    const properties = propertiesResult.rows
      .map(normalizeProperty)
      .filter((property) => isPropertyVisibleForAgent(property, userId, propertyIdsWithAgentMatches))
      .map((property) => enrichProperty(property, matches, contactNames));
    const actions = actionsResult.rows
      .map(normalizeAction)
      .filter((action) => action.user_id === userId || Boolean(action.contact_id && contactIdSet.has(action.contact_id)));

    return {
      connected: true,
      empty: !contacts.length && !properties.length && !matches.length && !actions.length,
      error: firstError([
        contactsResult.error,
        propertiesResult.error,
        matchesResult.error,
        actionsResult.error,
        connectionsResult.error,
        messagesResult.error
      ]),
      agencyId,
      userId,
      contacts,
      properties,
      matches,
      actions,
      connections: connectionsResult.rows.map(normalizeConnection),
      latestInteractionByContactId: buildLatestInteractionMap(messagesResult.rows)
    };
  } catch (error) {
    return emptyData(getErrorMessage(error));
  }
}

async function readRows<T>(query: PromiseLike<{ data: unknown; error: unknown }>) {
  try {
    const { data, error } = await withTimeout(query, timeoutMs);
    return {
      rows: (Array.isArray(data) ? data : []) as T[],
      error: error ? getErrorMessage(error) : null
    };
  } catch (error) {
    return { rows: [] as T[], error: getErrorMessage(error) };
  }
}

function enrichProperty(property: Property, matches: Match[], contactNames: Record<string, string>): PropertyMemory {
  const propertyMatches = matches.filter((match) => match.property_id === property.id);
  const bestMatch = propertyMatches[0];

  return {
    ...property,
    compatibleCount: propertyMatches.length,
    bestContactName: bestMatch ? contactNames[bestMatch.contact_id] ?? null : null
  };
}

function isPropertyVisibleForAgent(property: Property, userId: string, matchedPropertyIds: Set<string>) {
  if (property.created_by_user_id === userId || property.source_agent_id === userId) return true;
  if (matchedPropertyIds.has(property.id)) return true;
  if (!property.created_by_user_id && !property.source_agent_id) return true;
  if (property.visibility_scope === "personal" || property.visibility_scope === "private") return false;
  return property.source_type === "agency_website" && !property.source_agent_id;
}

function buildLatestInteractionMap(messages: MessageRow[]) {
  const map: Record<string, string> = {};

  for (const message of messages) {
    const contactId = text(message.contact_id);
    if (contactId && !map[contactId]) {
      map[contactId] = String(message.created_at ?? "");
    }
  }

  return map;
}

function normalizeContact(row: ContactRow): Contact {
  return {
    id: text(row.id),
    agency_id: text(row.agency_id),
    owner_user_id: nullableText(row.owner_user_id),
    first_name: text(row.first_name) || "Contact",
    last_name: text(row.last_name),
    phone: text(row.phone),
    email: text(row.email),
    source_channel: text(row.source_channel),
    contact_type: enumValue(row.contact_type, "unknown"),
    project_type: enumValue(row.project_type, "unknown"),
    min_budget: numberOrNull(row.min_budget),
    max_budget: numberOrNull(row.max_budget),
    desired_city: text(row.desired_city),
    desired_district: text(row.desired_district),
    desired_property_type: enumValue(row.desired_property_type, ""),
    desired_bedrooms: numberOrNull(row.desired_bedrooms),
    number_of_people: numberOrNull(row.number_of_people),
    professional_status: text(row.professional_status),
    income: numberOrNull(row.income),
    pets: enumValue(row.pets, "unknown"),
    move_in_date: text(row.move_in_date),
    financing_approved: enumValue(row.financing_approved, "unknown"),
    documents_ready: enumValue(row.documents_ready, "unknown"),
    urgency: enumValue(row.urgency, "medium"),
    seriousness_score: numberOrZero(row.seriousness_score),
    status: enumValue(row.status, "new"),
    missing_fields: jsonArray(row.missing_fields),
    notes: text(row.notes),
    created_at: text(row.created_at),
    updated_at: text(row.updated_at)
  } as Contact;
}

function normalizeProperty(row: PropertyRow): Property {
  return {
    id: text(row.id),
    agency_id: text(row.agency_id),
    created_by_user_id: nullableText(row.created_by_user_id),
    source_agent_name: nullableText(row.source_agent_name),
    source_agent_id: nullableText(row.source_agent_id),
    visibility_scope: enumValue(row.visibility_scope, "agency"),
    title: text(row.title) || "Bien sans titre",
    listing_type: enumValue(row.listing_type, "unknown"),
    category: enumValue(row.category, "other"),
    city: text(row.city),
    district: text(row.district),
    price: numberOrZero(row.price),
    surface: numberOrNull(row.surface),
    bedrooms: numberOrNull(row.bedrooms),
    available_from: text(row.available_from),
    pets_allowed: enumValue(row.pets_allowed, "unknown"),
    status: enumValue(row.status, "unknown"),
    description: text(row.description),
    source_url: text(row.source_url),
    source_type: enumValue(row.source_type, "manual"),
    created_at: text(row.created_at),
    updated_at: text(row.updated_at)
  } as Property;
}

function normalizeMatch(row: MatchRow): Match {
  return {
    id: text(row.id),
    agency_id: text(row.agency_id),
    contact_id: text(row.contact_id),
    property_id: text(row.property_id),
    contact_owner_user_id: nullableText(row.contact_owner_user_id),
    property_source_agent_name: nullableText(row.property_source_agent_name),
    score: numberOrZero(row.score),
    reasons: jsonArray(row.reasons),
    blocking_points: jsonArray(row.blocking_points),
    collaboration_opportunity: Boolean(row.collaboration_opportunity),
    match_context: enumValue(row.match_context, "agency_property"),
    status: enumValue(row.status, "proposed"),
    created_at: text(row.created_at),
    updated_at: text(row.updated_at)
  } as Match;
}

function normalizeAction(row: AiActionRow): AiActionProposal {
  return {
    id: text(row.id),
    agency_id: text(row.agency_id),
    contact_id: nullableText(row.contact_id),
    property_id: nullableText(row.property_id),
    match_id: nullableText(row.match_id),
    user_id: nullableText(row.user_id),
    action_type: enumValue(row.action_type, "notify_new_match"),
    priority: enumValue(row.priority, "medium"),
    title: text(row.title) || "Action proposee",
    summary: text(row.summary),
    proposed_message: text(row.proposed_message),
    status: enumValue(row.status, "pending"),
    requires_validation: Boolean(row.requires_validation),
    created_at: text(row.created_at),
    validated_at: nullableText(row.validated_at),
    executed_at: nullableText(row.executed_at)
  } as AiActionProposal;
}

function normalizeConnection(row: IntegrationConnectionRow): IntegrationConnection {
  return {
    id: text(row.id),
    agency_id: text(row.agency_id),
    integration_type: enumValue(row.integration_type, "agency_website"),
    status: enumValue(row.status, "not_connected"),
    config: isRecord(row.config) ? row.config : {},
    last_tested_at: nullableText(row.last_tested_at),
    last_success_at: nullableText(row.last_success_at),
    last_error: nullableText(row.last_error),
    created_at: text(row.created_at),
    updated_at: text(row.updated_at)
  } as IntegrationConnection;
}

function emptyData(error: string | null, connected = false): NestoData {
  return {
    connected,
    empty: true,
    error,
    agencyId: null,
    userId: null,
    contacts: [],
    properties: [],
    matches: [],
    actions: [],
    connections: [],
    latestInteractionByContactId: {}
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

function getContactName(contact: Contact) {
  return `${contact.first_name} ${contact.last_name}`.trim();
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) return String(error.message);
  return String(error || "Erreur Supabase inconnue.");
}

function text(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function nullableText(value: unknown) {
  const output = text(value);
  return output || null;
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function numberOrZero(value: unknown) {
  return numberOrNull(value) ?? 0;
}

function enumValue<T extends string>(value: unknown, fallback: T) {
  return (typeof value === "string" && value ? value : fallback) as T;
}

function jsonArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type ContactRow = Record<string, unknown>;
type PropertyRow = Record<string, unknown>;
type MatchRow = Record<string, unknown>;
type AiActionRow = Record<string, unknown>;
type IntegrationConnectionRow = Record<string, unknown>;
type MessageRow = Record<string, unknown>;
