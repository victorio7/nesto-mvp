export const TEAM_SESSION_COOKIE = "nesto_team_session_v2";
export const LEGACY_TEAM_SESSION_COOKIE = "nesto_team_session";

export function isTeamAccessEnabled() {
  return process.env.NESTO_TEAM_ACCESS === "true";
}

export function isValidTeamCode(code: string) {
  const expectedCode = process.env.NESTO_TEAM_CODE;
  return Boolean(expectedCode && code && code === expectedCode);
}
