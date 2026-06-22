import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/billing/stripe";
import { getServerSessionAgencyId } from "@/lib/auth/session";
import { sanitizeEmail, sanitizeText } from "@/lib/security/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const agencyId = await getServerSessionAgencyId();
  const origin = new URL(request.url).origin;
  const session = await createCheckoutSession({
    agencyId,
    email: sanitizeEmail(body.email),
    name: sanitizeText(body.name, 160),
    origin
  });
  return NextResponse.json(session);
}
