"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LEGACY_TEAM_SESSION_COOKIE, TEAM_SESSION_COOKIE } from "@/lib/team-auth";

export async function logoutTeam() {
  const cookieStore = await cookies();
  const expiredCookie = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    expires: new Date(0)
  };

  cookieStore.set(TEAM_SESSION_COOKIE, "", { ...expiredCookie, path: "/" });
  cookieStore.set(LEGACY_TEAM_SESSION_COOKIE, "", { ...expiredCookie, path: "/" });

  redirect("/team/login");
}
