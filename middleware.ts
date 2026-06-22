import { NextResponse, type NextRequest } from "next/server";
import {
  DEMO_SESSION_COOKIE,
  NESTO_AGENCY_COOKIE,
  NESTO_AGENT_USER_COOKIE,
  hasSupabaseAuthCookie
} from "@/lib/auth/session";
import { isTeamAccessEnabled, TEAM_SESSION_COOKIE } from "@/lib/team-auth";

const protectedPrefixes = [
  "/client-home",
  "/dashboard",
  "/onboarding",
  "/installation",
  "/sources",
  "/settings",
  "/contacts",
  "/properties",
  "/whatsapp-simulator"
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/team" || pathname.startsWith("/team/")) {
    return handleTeamRoute(request);
  }

  const isProtected = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!isProtected) return NextResponse.next();

  const cookieNames = request.cookies.getAll().map((cookie) => cookie.name);
  const hasDemoSession = request.cookies.get(DEMO_SESSION_COOKIE)?.value === "active";
  const hasSupabaseSession = hasSupabaseAuthCookie(cookieNames);
  const hasAgentCookie = Boolean(request.cookies.get(NESTO_AGENT_USER_COOKIE)?.value);
  const hasAgencyCookie = Boolean(request.cookies.get(NESTO_AGENCY_COOKIE)?.value);
  const hasActiveAgent = (hasDemoSession || hasSupabaseSession) && hasAgentCookie && hasAgencyCookie;

  if (hasActiveAgent) return NextResponse.next();

  const signupUrl = request.nextUrl.clone();
  signupUrl.pathname = "/signup";
  signupUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(signupUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/client-home/:path*",
    "/onboarding/:path*",
    "/installation/:path*",
    "/team/:path*",
    "/sources/:path*",
    "/settings/:path*",
    "/contacts/:path*",
    "/properties/:path*",
    "/whatsapp-simulator/:path*"
  ]
};

function handleTeamRoute(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isTeamAccessEnabled()) {
    if (pathname === "/team/login") return NextResponse.next();
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/team/login";
    loginUrl.searchParams.set("reserved", "1");
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/team/logout") return NextResponse.next();

  const hasTeamSession = request.cookies.get(TEAM_SESSION_COOKIE)?.value === "active";
  if (pathname === "/team/login") {
    if (!hasTeamSession) return NextResponse.next();
    const installationsUrl = request.nextUrl.clone();
    installationsUrl.pathname = "/team/installations";
    installationsUrl.search = "";
    return NextResponse.redirect(installationsUrl);
  }

  if (hasTeamSession) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/team/login";
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}
