import "server-only";
import {
  DEMO_AGENCY_ID,
  DEMO_AGENT_USER_ID,
  getServerSessionAgencyId,
  getServerSessionAgentUserId
} from "@/lib/auth/session";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";

const timeoutMs = 8000;

export type AgentWorkspace = {
  agencyId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  source: "session" | "agency_cookie" | "demo_fallback";
};

type SupabaseAdmin = NonNullable<ReturnType<typeof createSupabaseAdminClientOrNull>>;

export async function getActiveAgentWorkspace(supabase = createSupabaseAdminClientOrNull()) {
  if (!supabase) return null;

  const [sessionUserId, sessionAgencyId] = await Promise.all([
    getServerSessionAgentUserId(),
    getServerSessionAgencyId()
  ]);

  if (isUuid(sessionUserId)) {
    const workspace = await findWorkspaceByUserId(supabase, sessionUserId, "session");
    if (workspace) return workspace;
  }

  if (isUuid(sessionAgencyId)) {
    const workspace = await findWorkspaceByAgencyId(supabase, sessionAgencyId, "agency_cookie");
    if (workspace) return workspace;
  }

  return findWorkspaceByUserId(supabase, DEMO_AGENT_USER_ID, "demo_fallback")
    .then((workspace) => workspace ?? findFirstWorkspace(supabase));
}

export async function getActiveAgentWorkspaceOrThrow(supabase = createSupabaseAdminClientOrNull()) {
  const workspace = await getActiveAgentWorkspace(supabase);
  if (!workspace) throw new Error("Aucun espace agent Nesto actif.");
  return workspace;
}

async function findWorkspaceByUserId(
  supabase: SupabaseAdmin,
  userId: string,
  source: AgentWorkspace["source"]
) {
  const { data, error } = await withTimeout(
    supabase.from("agency_users").select("*").eq("id", userId).limit(1),
    timeoutMs
  );
  if (error) throw error;
  const row = Array.isArray(data) ? asRecord(data[0]) : {};
  return workspaceFromUserRow(row, source);
}

async function findWorkspaceByAgencyId(
  supabase: SupabaseAdmin,
  agencyId: string,
  source: AgentWorkspace["source"]
) {
  const { data, error } = await withTimeout(
    supabase
      .from("agency_users")
      .select("*")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: true })
      .limit(1),
    timeoutMs
  );
  if (error) throw error;
  const row = Array.isArray(data) ? asRecord(data[0]) : {};
  return workspaceFromUserRow(row, source);
}

async function findFirstWorkspace(supabase: SupabaseAdmin) {
  const { data, error } = await withTimeout(
    supabase
      .from("agency_users")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1),
    timeoutMs
  );
  if (error) throw error;
  const row = Array.isArray(data) ? asRecord(data[0]) : {};
  return workspaceFromUserRow(row, "demo_fallback");
}

function workspaceFromUserRow(row: Record<string, unknown>, source: AgentWorkspace["source"]) {
  const userId = text(row.id);
  const agencyId = text(row.agency_id);
  if (!userId || !agencyId) return null;

  return {
    agencyId,
    userId,
    fullName: text(row.full_name),
    email: text(row.email),
    phone: text(row.phone),
    role: text(row.role) || "agent",
    source
  } satisfies AgentWorkspace;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function asRecord(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function withTimeout<T>(query: PromiseLike<T>, ms: number) {
  return Promise.race([
    Promise.resolve(query),
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Supabase timeout after ${ms}ms.`)), ms);
    })
  ]);
}
