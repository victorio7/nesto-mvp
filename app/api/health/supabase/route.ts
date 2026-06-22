import { NextResponse } from "next/server";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const testedTable = "agencies";
const connectionTimeoutMs = 8000;

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const urlLooksValid = isValidSupabaseUrl(url);
  const configured = Boolean(url && anonKey && serviceRoleKey && urlLooksValid);
  const keyDiagnostics = {
    anonKeyLength: anonKey?.length ?? 0,
    serviceRoleKeyLength: serviceRoleKey?.length ?? 0,
    serviceRoleLooksDifferentFromAnonKey: Boolean(anonKey && serviceRoleKey && anonKey !== serviceRoleKey)
  };

  const basePayload = {
    configured,
    hasUrl: Boolean(url),
    hasAnonKey: Boolean(anonKey),
    hasServiceRoleKey: Boolean(serviceRoleKey),
    ...keyDiagnostics,
    urlLooksValid,
    canConnect: false,
    testedTable
  };

  if (!url || !anonKey || !serviceRoleKey) {
    return NextResponse.json({
      ...basePayload,
      error: "Configuration Supabase incomplete."
    });
  }

  if (!urlLooksValid) {
    return NextResponse.json({
      ...basePayload,
      error: "NEXT_PUBLIC_SUPABASE_URL n'a pas le format attendu."
    });
  }

  const supabase = createSupabaseAdminClientOrNull();

  if (!supabase) {
    return NextResponse.json({
      ...basePayload,
      error: "Client Supabase admin indisponible cote serveur."
    });
  }

  try {
    const { error } = await withTimeout(
      supabase.from(testedTable).select("id").limit(1),
      connectionTimeoutMs
    );

    if (error) {
      return NextResponse.json({
        ...basePayload,
        canConnect: false,
        error: sanitizeError(error)
      });
    }

    return NextResponse.json({
      ...basePayload,
      canConnect: true,
      error: null
    });
  } catch (error) {
    return NextResponse.json({
      ...basePayload,
      canConnect: false,
      error: sanitizeError(error)
    });
  }
}

function isValidSupabaseUrl(value: string | undefined) {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

function sanitizeError(error: unknown) {
  if (error instanceof Error) {
    const cause = error.cause instanceof Error ? `; cause: ${error.cause.message}` : "";
    return `${error.name}: ${error.message}${cause}`;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message?: unknown }).message ?? "Erreur Supabase inconnue.");
  }

  return String(error || "Erreur Supabase inconnue.");
}

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Supabase connection timed out after ${timeoutMs}ms.`));
      }, timeoutMs);
    })
  ]);
}
