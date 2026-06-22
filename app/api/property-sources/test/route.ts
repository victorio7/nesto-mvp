import { NextResponse } from "next/server";
import { testAgencyWebsiteSource } from "@/lib/integrations/websites";
import { validatePublicHttpUrl } from "@/lib/security/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const validatedUrl = validatePublicHttpUrl(body.sourceUrl);

  if (!validatedUrl.ok) {
    return NextResponse.json({ error: validatedUrl.error }, { status: 400 });
  }

  const result = await testAgencyWebsiteSource(validatedUrl.value);
  return NextResponse.json(result);
}
