import { cookies } from "next/headers";

export const DEMO_SESSION_COOKIE = "immopilot_session";
export const DEMO_AGENCY_COOKIE = "immopilot_agency_id";
export const NESTO_AGENT_USER_COOKIE = "nesto_agent_user_id";
export const NESTO_AGENCY_COOKIE = "nesto_agency_id";

export const DEMO_AGENCY_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_AGENT_USER_ID = "00000000-0000-0000-0000-000000000101";

export async function getServerSessionAgencyId() {
  const cookieStore = await cookies();
  return cookieStore.get(NESTO_AGENCY_COOKIE)?.value ?? cookieStore.get(DEMO_AGENCY_COOKIE)?.value ?? null;
}

export async function getServerSessionAgentUserId() {
  const cookieStore = await cookies();
  return cookieStore.get(NESTO_AGENT_USER_COOKIE)?.value ?? null;
}

export function hasSupabaseAuthCookie(cookieNames: string[]) {
  return cookieNames.some((name) => name.startsWith("sb-") && name.includes("auth-token"));
}
