import OpenAI from "openai";
import type { PropertyCategory, PropertyStatus, TriState } from "@/lib/types";
import { safeJsonParse } from "@/lib/utils/safe-json";

export type ParsedProperty = {
  title: string;
  listing_type: "rental" | "sale" | "unknown";
  category: PropertyCategory;
  city: string;
  district: string;
  price: number | null;
  surface: number | null;
  bedrooms: number | null;
  available_from: string;
  pets_allowed: TriState;
  status: PropertyStatus;
  description: string;
  source_url: string;
  confidence_score: number;
  missing_fields: string[];
};

const fallbackParsedProperty: ParsedProperty = {
  title: "",
  listing_type: "unknown",
  category: "other",
  city: "",
  district: "",
  price: null,
  surface: null,
  bedrooms: null,
  available_from: "",
  pets_allowed: "unknown",
  status: "unknown",
  description: "",
  source_url: "",
  confidence_score: 0,
  missing_fields: []
};

export async function parsePropertyWithAI(rawContent: string, sourceUrl = ""): Promise<ParsedProperty> {
  if (!process.env.OPENAI_API_KEY) {
    return parsePropertyHeuristically(rawContent, sourceUrl);
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Tu extrais une annonce immobiliere en JSON strict. N'invente pas les champs absents. Utilise unknown/null quand necessaire."
        },
        {
          role: "user",
          content: `Source URL: ${sourceUrl}\n\nContenu brut:\n${rawContent}\n\nRetourne exactement les champs demandes par le schema Nesto.`
        }
      ]
    });

    const content = completion.choices[0]?.message.content;
    const parsed = safeJsonParse<Partial<ParsedProperty>>(content, parsePropertyHeuristically(rawContent, sourceUrl), "OpenAI property parser");
    return normalizeParsedProperty(parsed, sourceUrl);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[parsePropertyWithAI] Falling back to local parser.", error);
    }
    return parsePropertyHeuristically(rawContent, sourceUrl);
  }
}

export function parsePropertyHeuristically(rawContent: string, sourceUrl = ""): ParsedProperty {
  const text = rawContent.trim();
  const lower = text.toLowerCase();
  const priceMatch = text.match(/(\d[\d\s.]{3,})\s*(?:f|xpf|eur|€)/i);
  const surfaceMatch = text.match(/(\d{2,4})\s*(?:m2|m²)/i);
  const bedroomsMatch = text.match(/(\d+)\s*(?:chambres?|ch\.)/i);
  const category = detectCategory(lower);
  const city = ["punaauia", "papeete", "faaa", "arue", "pirae", "moorea"].find((candidate) =>
    lower.includes(candidate)
  );

  const parsed: ParsedProperty = {
    ...fallbackParsedProperty,
    title: text.split("\n")[0]?.slice(0, 90) || "Annonce importee",
    listing_type: lower.includes("vendre") || lower.includes("vente") ? "sale" : lower.includes("loyer") ? "rental" : "unknown",
    category,
    city: city ? capitalize(city) : "",
    price: priceMatch ? Number(priceMatch[1].replace(/[^\d]/g, "")) : null,
    surface: surfaceMatch ? Number(surfaceMatch[1]) : null,
    bedrooms: bedroomsMatch ? Number(bedroomsMatch[1]) : category === "studio" ? 0 : null,
    pets_allowed: lower.includes("animaux accept") || lower.includes("animal accepte") ? "yes" : "unknown",
    status: lower.includes("reserve") ? "reserved" : lower.includes("loue") ? "rented" : "available",
    description: text.slice(0, 450),
    source_url: sourceUrl,
    confidence_score: 52,
    missing_fields: []
  };

  parsed.missing_fields = Object.entries(parsed)
    .filter(([key, value]) => ["title", "listing_type", "city", "price", "surface"].includes(key) && (!value || value === "unknown"))
    .map(([key]) => key);

  return parsed;
}

function normalizeParsedProperty(value: Partial<ParsedProperty>, sourceUrl: string): ParsedProperty {
  const parsed = { ...fallbackParsedProperty, ...value, source_url: value.source_url || sourceUrl };
  parsed.missing_fields = parsed.missing_fields ?? [];
  parsed.confidence_score = Math.max(0, Math.min(100, Number(parsed.confidence_score ?? 0)));
  return parsed;
}

function detectCategory(text: string): PropertyCategory {
  if (text.includes("studio")) return "studio";
  if (text.includes("t2") || text.includes("f2")) return "t2";
  if (text.includes("t3") || text.includes("f3")) return "t3";
  if (text.includes("maison") || text.includes("villa")) return "house";
  if (text.includes("terrain")) return "land";
  if (text.includes("local") || text.includes("commercial")) return "commercial";
  return "other";
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
