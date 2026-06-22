import "server-only";
import { getWritableInstallationAgencyId } from "@/lib/installation-data";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";
import type { PropertySource } from "@/lib/types";

const timeoutMs = 8000;

export async function getPropertySourcesData() {
  const supabase = createSupabaseAdminClientOrNull();
  if (!supabase) return { connected: false, error: "Supabase n'est pas configure.", sources: [] as PropertySource[] };

  try {
    const agencyId = await getWritableInstallationAgencyId(supabase);
    if (!agencyId) return { connected: true, error: null, sources: [] as PropertySource[] };

    const { data, error } = await withTimeout(
      supabase
        .from("property_sources")
        .select("*")
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false }),
      timeoutMs
    );

    if (error) {
      return { connected: true, error: getErrorMessage(error), sources: [] as PropertySource[] };
    }

    return {
      connected: true,
      error: null,
      sources: (Array.isArray(data) ? data : []).map(normalizePropertySource)
    };
  } catch (error) {
    return { connected: false, error: getErrorMessage(error), sources: [] as PropertySource[] };
  }
}

function normalizePropertySource(row: Record<string, unknown>): PropertySource {
  return {
    id: text(row.id),
    agency_id: text(row.agency_id),
    source_type: text(row.source_type) as PropertySource["source_type"],
    name: text(row.name) || "Source agence",
    source_url: text(row.source_url),
    status: text(row.status) as PropertySource["status"],
    check_frequency_minutes: numberOr(row.check_frequency_minutes, 360),
    last_checked_at: nullableText(row.last_checked_at),
    last_success_at: nullableText(row.last_success_at),
    last_error: nullableText(row.last_error),
    created_at: text(row.created_at)
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) return String(error.message);
  return String(error || "Erreur inconnue.");
}

function text(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function nullableText(value: unknown) {
  const output = text(value);
  return output || null;
}

function numberOr(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
