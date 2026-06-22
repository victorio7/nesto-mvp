import { NextResponse } from "next/server";
import {
  DEMO_AGENCY_COOKIE,
  DEMO_AGENCY_ID,
  DEMO_AGENT_USER_ID,
  DEMO_SESSION_COOKIE,
  NESTO_AGENCY_COOKIE,
  NESTO_AGENT_USER_COOKIE
} from "@/lib/auth/session";
import { sanitizeEmail } from "@/lib/security/validation";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = sanitizeEmail(body.email) || "demo@immopilot.ai";
  const workspace = await findWorkspaceByEmail(email);
  const agencyId = workspace?.agencyId ?? DEMO_AGENCY_ID;
  const agentUserId = workspace?.agentUserId ?? DEMO_AGENT_USER_ID;

  const response = NextResponse.json({
    ok: true,
    email,
    agency_id: agencyId,
    agent_user_id: agentUserId
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
  response.cookies.set(NESTO_AGENT_USER_COOKIE, agentUserId, cookieOptions);
  return response;
}

async function findWorkspaceByEmail(email: string) {
  const supabase = createSupabaseAdminClientOrNull();
  if (!supabase || !email) return null;

  const { data, error } = await supabase
    .from("agency_users")
    .select("id, agency_id")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.id || !data.agency_id) return null;

  return {
    agencyId: String(data.agency_id),
    agentUserId: String(data.id)
  };
}
