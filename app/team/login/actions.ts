"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isTeamAccessEnabled, isValidTeamCode, TEAM_SESSION_COOKIE } from "@/lib/team-auth";

export async function loginTeam(formData: FormData) {
  const code = String(formData.get("teamCode") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!isTeamAccessEnabled()) {
    redirect("/team/login?reserved=1");
  }

  if (!isValidTeamCode(code)) {
    redirect(`/team/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(TEAM_SESSION_COOKIE, "active", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });

  redirect(next);
}

function safeNextPath(value: string) {
  if (value.startsWith("/team/") && !value.startsWith("/team/login") && !value.startsWith("/team/logout")) {
    return value;
  }
  return "/team/installations";
}
