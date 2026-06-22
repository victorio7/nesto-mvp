import { NextResponse } from "next/server";
import { getServerSessionAgencyId } from "@/lib/auth/session";
import { sanitizeEmail, sanitizeText, validatePublicHttpUrl } from "@/lib/security/validation";
import { createSupabaseAdminClientOrNull } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const agencyId = await getServerSessionAgencyId();
  if (!agencyId) {
    return NextResponse.json({ error: "Session requise." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const stepKey = sanitizeText(body.stepKey, 80);
  if (!stepKey) {
    return NextResponse.json({ error: "Etape requise." }, { status: 400 });
  }

  const data = sanitizeOnboardingData(body.data ?? {});
  const supabase = createSupabaseAdminClientOrNull();

  if (supabase) {
    await supabase.from("onboarding_steps").upsert(
      {
        agency_id: agencyId,
        step_key: stepKey,
        status: "completed",
        data,
        updated_at: new Date().toISOString()
      },
      { onConflict: "agency_id,step_key" }
    );
  }

  return NextResponse.json({
    ok: true,
    agency_id: agencyId,
    step_key: stepKey,
    data
  });
}

function sanitizeOnboardingData(input: unknown) {
  if (!input || typeof input !== "object") return {};

  const record = input as Record<string, unknown>;
  const data: Record<string, string> = {};

  for (const [key, value] of Object.entries(record)) {
    if (key.toLowerCase().includes("email")) {
      data[key] = sanitizeEmail(value);
      continue;
    }

    if (key.toLowerCase().includes("url")) {
      const validated = validatePublicHttpUrl(value);
      if (validated.ok) data[key] = validated.value;
      continue;
    }

    data[key] = sanitizeText(value, 500);
  }

  return data;
}
