import { NextResponse } from "next/server";
import { LEGACY_TEAM_SESSION_COOKIE, TEAM_SESSION_COOKIE } from "@/lib/team-auth";

export function GET(request: Request) {
  const url = new URL("/team/login", request.url);
  const response = NextResponse.redirect(url, 303);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  for (const cookieName of [TEAM_SESSION_COOKIE, LEGACY_TEAM_SESSION_COOKIE]) {
    response.cookies.set(cookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
      expires: new Date(0)
    });
  }
  return response;
}
