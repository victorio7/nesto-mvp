import { NextResponse } from "next/server";
import { parsePropertyWithAI } from "@/lib/ai/property-parser";
import { sanitizeText, validatePublicHttpUrl } from "@/lib/security/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const rawContent = sanitizeText(body.rawContent, 10000);
  const sourceUrl = sanitizeText(body.sourceUrl, 2048);

  if (!rawContent.trim()) {
    return NextResponse.json({ error: "rawContent is required" }, { status: 400 });
  }

  if (sourceUrl) {
    const validatedUrl = validatePublicHttpUrl(sourceUrl);
    if (!validatedUrl.ok) {
      return NextResponse.json({ error: validatedUrl.error }, { status: 400 });
    }
  }

  const parsed = await parsePropertyWithAI(rawContent, sourceUrl);
  return NextResponse.json(parsed);
}
